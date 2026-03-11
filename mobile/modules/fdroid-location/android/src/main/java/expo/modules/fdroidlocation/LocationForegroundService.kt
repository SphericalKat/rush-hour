package expo.modules.fdroidlocation

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

class LocationForegroundService : Service(), LocationListener {
  private var locationManager: LocationManager? = null
  private var taskName: String? = null

  companion object {
    private const val CHANNEL_ID = "fdroid_location_channel"
    private const val NOTIFICATION_ID = 7834
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent == null) {
      stopSelf()
      return START_NOT_STICKY
    }

    taskName = intent.getStringExtra("taskName")
    val timeInterval = intent.getLongExtra("timeInterval", 15000L)
    val distanceInterval = intent.getFloatExtra("distanceInterval", 50f)
    val title = intent.getStringExtra("notificationTitle") ?: "Location Sharing"
    val body = intent.getStringExtra("notificationBody") ?: "Sharing your location"
    val colorStr = intent.getStringExtra("notificationColor")

    createNotificationChannel()
    val notification = buildNotification(title, body, colorStr)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }

    startLocationUpdates(timeInterval, distanceInterval)

    return START_STICKY
  }

  private fun startLocationUpdates(timeInterval: Long, distanceInterval: Float) {
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
      != PackageManager.PERMISSION_GRANTED
    ) {
      stopSelf()
      return
    }

    locationManager = getSystemService(LOCATION_SERVICE) as LocationManager

    val providers = mutableListOf<String>()
    if (locationManager?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true) {
      providers.add(LocationManager.GPS_PROVIDER)
    }
    if (locationManager?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true) {
      providers.add(LocationManager.NETWORK_PROVIDER)
    }

    for (provider in providers) {
      locationManager?.requestLocationUpdates(provider, timeInterval, distanceInterval, this)
    }
  }

  override fun onLocationChanged(location: Location) {
    // Location updates keep the LocationManager cache fresh.
    // JS foreground polling reads via getLastKnownPositionAsync and pushes to server.
  }

  override fun onDestroy() {
    locationManager?.removeUpdates(this)
    locationManager = null
    taskName?.let { FdroidLocationModule.activeTasks.remove(it) }
    super.onDestroy()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Location Sharing",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Shows when location is being shared"
      }
      val manager = getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
    }
  }

  private fun buildNotification(title: String, body: String, colorStr: String?): Notification {
    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(body)
      .setSmallIcon(android.R.drawable.ic_menu_mylocation)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)

    if (colorStr != null) {
      try {
        builder.color = Color.parseColor(colorStr)
      } catch (_: Exception) {}
    }

    return builder.build()
  }
}
