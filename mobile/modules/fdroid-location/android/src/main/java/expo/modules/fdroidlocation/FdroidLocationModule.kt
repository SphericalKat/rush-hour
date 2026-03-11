package expo.modules.fdroidlocation

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import androidx.core.content.ContextCompat
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FdroidLocationModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exception("React context not available")

  private val locationManager: LocationManager
    get() = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

  companion object {
    // Tracks which task names have active location updates
    val activeTasks = mutableSetOf<String>()
  }

  override fun definition() = ModuleDefinition {
    Name("FdroidLocation")

    AsyncFunction("requestForegroundPermissionsAsync") { promise: Promise ->
      val granted = ContextCompat.checkSelfPermission(
        context, Manifest.permission.ACCESS_FINE_LOCATION
      ) == PackageManager.PERMISSION_GRANTED

      if (granted) {
        promise.resolve(bundleOf("status" to "granted"))
      } else {
        val permissions = appContext.permissions
        if (permissions == null) {
          promise.resolve(bundleOf("status" to "denied"))
          return@AsyncFunction
        }
        permissions.askForPermissions(
          { result ->
            val status = if (result.values.all { it.status == PermissionsStatus.GRANTED }) "granted" else "denied"
            promise.resolve(bundleOf("status" to status))
          },
          Manifest.permission.ACCESS_FINE_LOCATION,
          Manifest.permission.ACCESS_COARSE_LOCATION
        )
      }
    }

    AsyncFunction("requestBackgroundPermissionsAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        promise.resolve(bundleOf("status" to "granted"))
        return@AsyncFunction
      }

      val granted = ContextCompat.checkSelfPermission(
        context, Manifest.permission.ACCESS_BACKGROUND_LOCATION
      ) == PackageManager.PERMISSION_GRANTED

      if (granted) {
        promise.resolve(bundleOf("status" to "granted"))
      } else {
        val permissions = appContext.permissions
        if (permissions == null) {
          promise.resolve(bundleOf("status" to "denied"))
          return@AsyncFunction
        }
        permissions.askForPermissions(
          { result ->
            val status = if (result.values.all { it.status == PermissionsStatus.GRANTED }) "granted" else "denied"
            promise.resolve(bundleOf("status" to status))
          },
          Manifest.permission.ACCESS_BACKGROUND_LOCATION
        )
      }
    }

    AsyncFunction("getLastKnownPositionAsync") { promise: Promise ->
      if (ContextCompat.checkSelfPermission(
          context, Manifest.permission.ACCESS_FINE_LOCATION
        ) != PackageManager.PERMISSION_GRANTED
      ) {
        promise.resolve(null)
        return@AsyncFunction
      }

      val lm = locationManager
      val location = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER)
        ?: lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)

      if (location != null) {
        promise.resolve(locationToBundle(location))
      } else {
        promise.resolve(null)
      }
    }

    AsyncFunction("startLocationUpdatesAsync") { taskName: String, options: Map<String, Any?>, promise: Promise ->
      if (ContextCompat.checkSelfPermission(
          context, Manifest.permission.ACCESS_FINE_LOCATION
        ) != PackageManager.PERMISSION_GRANTED
      ) {
        promise.reject("E_NO_PERMISSIONS", "Location permission not granted", null)
        return@AsyncFunction
      }

      val timeInterval = (options["timeInterval"] as? Number)?.toLong() ?: 15000L
      val distanceInterval = (options["distanceInterval"] as? Number)?.toFloat() ?: 50f

      val foregroundService = options["foregroundService"] as? Map<*, *>
      val title = foregroundService?.get("notificationTitle") as? String ?: "Location Sharing"
      val body = foregroundService?.get("notificationBody") as? String ?: "Sharing your location"
      val color = foregroundService?.get("notificationColor") as? String

      // Start the foreground service
      val serviceIntent = Intent(context, LocationForegroundService::class.java).apply {
        putExtra("taskName", taskName)
        putExtra("timeInterval", timeInterval)
        putExtra("distanceInterval", distanceInterval)
        putExtra("notificationTitle", title)
        putExtra("notificationBody", body)
        if (color != null) putExtra("notificationColor", color)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(serviceIntent)
      } else {
        context.startService(serviceIntent)
      }

      activeTasks.add(taskName)
      promise.resolve(null)
    }

    AsyncFunction("stopLocationUpdatesAsync") { taskName: String, promise: Promise ->
      val serviceIntent = Intent(context, LocationForegroundService::class.java)
      context.stopService(serviceIntent)
      activeTasks.remove(taskName)
      promise.resolve(null)
    }

    AsyncFunction("hasStartedLocationUpdatesAsync") { taskName: String, promise: Promise ->
      promise.resolve(activeTasks.contains(taskName))
    }
  }
}

fun locationToBundle(location: Location): Bundle {
  val coords = Bundle().apply {
    putDouble("latitude", location.latitude)
    putDouble("longitude", location.longitude)
    putDouble("altitude", location.altitude)
    putFloat("accuracy", location.accuracy)
    putFloat("speed", location.speed)
    putFloat("heading", location.bearing)
  }
  return Bundle().apply {
    putBundle("coords", coords)
    putDouble("timestamp", location.time.toDouble())
  }
}

fun bundleOf(vararg pairs: Pair<String, Any?>): Bundle {
  return Bundle().apply {
    for ((key, value) in pairs) {
      when (value) {
        is String -> putString(key, value)
        is Boolean -> putBoolean(key, value)
        is Int -> putInt(key, value)
        is Double -> putDouble(key, value)
        is Bundle -> putBundle(key, value)
        null -> putString(key, null)
      }
    }
  }
}
