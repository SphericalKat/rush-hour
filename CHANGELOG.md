# Changelog

## [0.13.1](https://github.com/SphericalKat/rush-hour/compare/v0.13.0...v0.13.1) (2026-06-22)


### Bug Fixes

* **deps:** update module github.com/knadh/koanf/parsers/toml/v2 to v2.2.1 ([8d52ea6](https://github.com/SphericalKat/rush-hour/commit/8d52ea64e7f2ac0864c1785d81dad07525af28ec))
* **deps:** update module github.com/knadh/koanf/parsers/toml/v2 to v2.2.1 ([486b3d9](https://github.com/SphericalKat/rush-hour/commit/486b3d93a3c527783ba170f97fa16257f29ffe14))
* inline Expo public env reads ([cfd2af6](https://github.com/SphericalKat/rush-hour/commit/cfd2af60a3679d16b8cce7194c5cfdcec8c3db5a))

## [0.13.0](https://github.com/SphericalKat/rush-hour/compare/v0.12.0...v0.13.0) (2026-05-24)


### Features

* show station picker loading skeleton ([5e86916](https://github.com/SphericalKat/rush-hour/commit/5e86916a8e029f041307bb44900c8418d1f8c926))


### Bug Fixes

* open station picker with bottom sheet modal ref ([d7fa43d](https://github.com/SphericalKat/rush-hour/commit/d7fa43dad16938623a35c0036b90b9df01dfad95))
* reduce station picker opening stutter ([d4a1fad](https://github.com/SphericalKat/rush-hour/commit/d4a1fad874833f49465b74f297d4eef0e88763aa))

## [0.12.0](https://github.com/SphericalKat/rush-hour/compare/v0.11.0...v0.12.0) (2026-05-18)


### Features

* add fastlane metadata ([edcf809](https://github.com/SphericalKat/rush-hour/commit/edcf8093a105631c6052363418e62c3e72f006da))
* add mobile app ([04fcfa5](https://github.com/SphericalKat/rush-hour/commit/04fcfa5ea8c51e0633202c42a7755d4db5bec8ea))
* allow searching by station code ([bd4a6a5](https://github.com/SphericalKat/rush-hour/commit/bd4a6a5822e58753f9409656a2db77fa92b2adcf))
* **app:** set up nativewind components ([7619c08](https://github.com/SphericalKat/rush-hour/commit/7619c08e244a6bdbcabda0de2e8b4372dfc861e2))
* automate releases with release-please ([74e2e8b](https://github.com/SphericalKat/rush-hour/commit/74e2e8b0d0c728aef90b2bfe976f87a58e76af4a))
* **backend:** add GPS position resolver and location sharing endpoint ([77a5955](https://github.com/SphericalKat/rush-hour/commit/77a595540bb67ba13a6b3be0b41e1e08a4c76169))
* **backend:** add platform field to departures API ([7bc7529](https://github.com/SphericalKat/rush-hour/commit/7bc75294ebc3b8809e1791f4fa27a0b6d33f46f5))
* **backend:** add Redis caching for departures ([f57ae33](https://github.com/SphericalKat/rush-hour/commit/f57ae33c95f04a102212b82bdd33814e6572e765))
* **backend:** add route endpoint with pass-through stations ([949e9ec](https://github.com/SphericalKat/rush-hour/commit/949e9eccb9123759f4a72e633a85e33a70dac32d))
* **backend:** expose runs_on and note in departures API ([408a7a1](https://github.com/SphericalKat/rush-hour/commit/408a7a1b2a8bf988b0a2e622e2ac96b227262684))
* **backend:** merge crowdsourced and m-indicator live data ([c927603](https://github.com/SphericalKat/rush-hour/commit/c927603ab27ae52809ed80dcc3281cc4a1d7b058))
* **backend:** return all departures, remove direction filter ([e569811](https://github.com/SphericalKat/rush-hour/commit/e569811a9f77a7cb791c0792da5293161df0696f))
* **backend:** transparently proxy to mindicator to fetch live data ([81d5f98](https://github.com/SphericalKat/rush-hour/commit/81d5f983635454cdbb45f2148b16086f5c73a8c7))
* **departures:** grey out trains not running on a given day ([35d8b8c](https://github.com/SphericalKat/rush-hour/commit/35d8b8c323291e73e6b9f6b556d9673c51fcc431))
* **deploy:** add ansible playbook and makefile targets ([071e4cd](https://github.com/SphericalKat/rush-hour/commit/071e4cd8cda6ecc473284196402f2371996760fd))
* **info:** show app licenses and sources ([a3c922b](https://github.com/SphericalKat/rush-hour/commit/a3c922b90df911639e13ca631f4848d23bc60612))
* **ios:** create release configs and icons ([1ec8957](https://github.com/SphericalKat/rush-hour/commit/1ec89577fd016bc05f1595461af07253447d7c1d))
* **location:** add modal to inform users of location collection ([1e4c4de](https://github.com/SphericalKat/rush-hour/commit/1e4c4de4caf3a6c8d8d2a28af867e3c7e0c24198))
* **mobile:** add fast and AC filter chips on departures screen ([60ea6e9](https://github.com/SphericalKat/rush-hour/commit/60ea6e95ea2a72a2d190f8d4ca60b4f897353e2c))
* **mobile:** add favorites tab with long-press and heart toggle ([794f5f7](https://github.com/SphericalKat/rush-hour/commit/794f5f7c4015b812b5c67118cfe231fbd154b1dd))
* **mobile:** add light pink bg to ladies special trains ([ed693df](https://github.com/SphericalKat/rush-hour/commit/ed693df735026049d0687343fb823d01c98a0a36))
* **mobile:** add live tracking ([e2c8c42](https://github.com/SphericalKat/rush-hour/commit/e2c8c426773de7234e82700bb4bd561df522167d))
* **mobile:** add location sharing with expo-location ([bbb5d22](https://github.com/SphericalKat/rush-hour/commit/bbb5d22b3fcacc21846880f41b6b1bc2c97a0b72))
* **mobile:** add Material You on Android, iOS system colors ([e7310f5](https://github.com/SphericalKat/rush-hour/commit/e7310f5873b037c69b0bde4c976287370a57270d))
* **mobile:** background location sharing with foreground service ([2ed2792](https://github.com/SphericalKat/rush-hour/commit/2ed2792f0025a6ea2117ff1d1ea6154959245658))
* **mobile:** check for updates inside the app ([447a4b9](https://github.com/SphericalKat/rush-hour/commit/447a4b93e914a142159b5bebacac52d9d4d5dba7))
* **mobile:** display schedule badges on departure cards ([01411e1](https://github.com/SphericalKat/rush-hour/commit/01411e163a62f2eb180c8178c644b8ea5f3be7f2))
* **mobile:** flat redesign with green theme and color-coded train cards ([d915fda](https://github.com/SphericalKat/rush-hour/commit/d915fda6e2910063c2368ddb53357233958ec9b1))
* **mobile:** improve favorites with live tracking, remove lines tab ([2ceb560](https://github.com/SphericalKat/rush-hour/commit/2ceb560ea7c2136270ae08c1ee7d6731115e0761))
* **mobile:** improve station picker sheet UI ([0a04f18](https://github.com/SphericalKat/rush-hour/commit/0a04f184bbdf3a9519de8724b49a11823a51251b))
* **mobile:** rework train detail with expected times, status up top, refresh countdown ([46d3916](https://github.com/SphericalKat/rush-hour/commit/46d391648024a98019217ad52d797d03db62479c))
* **mobile:** show pass-through stations and use API delay ([7e1e82f](https://github.com/SphericalKat/rush-hour/commit/7e1e82facd99e134271aa865af888dad28ce98a8))
* **mobile:** show past departures with progressive loading ([e2cecc8](https://github.com/SphericalKat/rush-hour/commit/e2cecc856e2522fe88312ec29db21f9a8c60ab8c))
* **mobile:** show platform number on departure cards ([8c4738d](https://github.com/SphericalKat/rush-hour/commit/8c4738d3294a8d93ea7db79cc76ffeb57adf67be))
* **nav:** use native navigation bars on android/ios ([8846686](https://github.com/SphericalKat/rush-hour/commit/884668636be1209cc78ce2c287c2e3d031476739))
* **parser:** add APK-based timetable extraction pipeline ([8396608](https://github.com/SphericalKat/rush-hour/commit/839660858e7757cb240d92c9665e4bd820d59055))
* **parser:** add runs_on and note fields from schedule data ([7075e28](https://github.com/SphericalKat/rush-hour/commit/7075e28bbac89ed9a4c7088205e885e5fd70e78d))
* **parser:** populate station lat/lng from m-indicator APK ([8c0c4e8](https://github.com/SphericalKat/rush-hour/commit/8c0c4e8ea4ac90e5f27f7535d0c04a8480582a80))
* **privacy:** add privacy policy document ([cf388c9](https://github.com/SphericalKat/rush-hour/commit/cf388c914f19340b6155cad086681633fd86a1c4))
* **routes:** allow routes with transfers ([62fef29](https://github.com/SphericalKat/rush-hour/commit/62fef29d363e1af214eca8c3fd2be9fe0f6bd9c2))
* **settings:** make live data optional and configurable url ([1671957](https://github.com/SphericalKat/rush-hour/commit/16719577f8b1e451c41ede97fa702650fc90f840))
* **tabs:** use filled icons when selected ([e6fe832](https://github.com/SphericalKat/rush-hour/commit/e6fe83270a10180d5467a373a0630fe6a9a8e4a1))
* **tabs:** use filled icons when selected ([01a5417](https://github.com/SphericalKat/rush-hour/commit/01a54176254cb1fad16151757a42cccbe834239e))


### Bug Fixes

* **android:** configure plugin for abi splits ([9d6c32c](https://github.com/SphericalKat/rush-hour/commit/9d6c32caaceea8c13b9387e83052032c6a6cd149))
* **android:** prevent creating multiple signing blocks ([971a84c](https://github.com/SphericalKat/rush-hour/commit/971a84c31f12a8fe556075362611b06dad52e33d))
* **app:** add monochrome icon ([061da3b](https://github.com/SphericalKat/rush-hour/commit/061da3bfb5a17d9dc7d8b78e217f5ac3516c50db))
* **app:** UI perf improvements ([4ea1e91](https://github.com/SphericalKat/rush-hour/commit/4ea1e91ce1bbfb4ea4c59a3c9f9f2739a47b1cf4))
* **backend:** add runs_on and note columns to test fixtures ([84de984](https://github.com/SphericalKat/rush-hour/commit/84de984a09b583a8e4d306ccf57bd3dcacb594ca))
* **backend:** correct status codes and use line stations for GPS resolution ([b7d102d](https://github.com/SphericalKat/rush-hour/commit/b7d102dbeb515bf3e560789510ecb41aad0782d9))
* **backend:** filter train stops by line to prevent route interleaving ([fddfce1](https://github.com/SphericalKat/rush-hour/commit/fddfce1a9ccf4eca9eb633e7ea9e32bc070e5b8e))
* **backend:** return all departures in chronological order ([071a415](https://github.com/SphericalKat/rush-hour/commit/071a4152947dcfe973d89dafb1e19f0c3585b994))
* **build:** append version to apks before upload ([64b0beb](https://github.com/SphericalKat/rush-hour/commit/64b0bebe7ed32a18477ec9f35a5cb31fac57f248))
* **ci:** set expo distribution to play ([2b26041](https://github.com/SphericalKat/rush-hour/commit/2b26041fb71488a7621c2ebec6882ad08c7904f7))
* **ci:** use correct path to keystore file ([f82d7e2](https://github.com/SphericalKat/rush-hour/commit/f82d7e2e778fda5ad06c852e306021c9a7982630))
* **config:** upgrade to koanf v2 ([40ddc3d](https://github.com/SphericalKat/rush-hour/commit/40ddc3d65514d8df1d758791fb0a744652292203))
* **deps:** update dependency react-native-gesture-handler to ~2.31.0 ([5516dd8](https://github.com/SphericalKat/rush-hour/commit/5516dd83fbeb30d46b873aa38aa481d5363de236))
* **deps:** update dependency react-native-gesture-handler to ~2.31.0 ([3f4bd85](https://github.com/SphericalKat/rush-hour/commit/3f4bd856ef46b65815cf9a8a0ecd626f841013ed))
* **deps:** update dependency react-native-reanimated to v4.2.2 ([52ff1c5](https://github.com/SphericalKat/rush-hour/commit/52ff1c5072edefdb5f2295fbbff909de440c1c0c))
* **deps:** update dependency react-native-reanimated to v4.2.2 ([4185bad](https://github.com/SphericalKat/rush-hour/commit/4185badaf2ccf6d0c786afcb9a3642f9d2f63ee0))
* **deps:** update dependency react-native-reanimated to v4.3.0 ([f7adfac](https://github.com/SphericalKat/rush-hour/commit/f7adfacc1c71290679484cd497922bff6e69304b))
* **deps:** update dependency react-native-reanimated to v4.3.0 ([e5218a5](https://github.com/SphericalKat/rush-hour/commit/e5218a5121a55f74a8452dcd26811ef3930af5e8))
* **deps:** update dependency react-native-safe-area-context to ~5.7.0 ([84a8a17](https://github.com/SphericalKat/rush-hour/commit/84a8a172bd68a22d464084e6103ae44878230161))
* **deps:** update dependency react-native-safe-area-context to ~5.7.0 ([90bbf33](https://github.com/SphericalKat/rush-hour/commit/90bbf3394a5c9e27b5e6f087217e48cc315fe116))
* **deps:** update dependency react-native-screens to ~4.24.0 ([b84fde6](https://github.com/SphericalKat/rush-hour/commit/b84fde69164305ce5145ed779f1c5c323f0a4e0c))
* **deps:** update dependency react-native-screens to ~4.24.0 ([0aaabfd](https://github.com/SphericalKat/rush-hour/commit/0aaabfddf0d5a6a5f631d197076210c781afb835))
* **deps:** update dependency react-native-worklets to v0.7.4 ([8bd2ab9](https://github.com/SphericalKat/rush-hour/commit/8bd2ab9b4dd93fe26439a72ecdbf94b0aff7ea1e))
* **deps:** update dependency react-native-worklets to v0.7.4 ([df939d1](https://github.com/SphericalKat/rush-hour/commit/df939d1cff439df25e83dae0b305eed23334dab3))
* **deps:** update dependency react-native-worklets to v0.8.1 ([5809d90](https://github.com/SphericalKat/rush-hour/commit/5809d90e29633ad92f428d45ba9c27d367120b5e))
* **deps:** update dependency react-native-worklets to v0.8.1 ([923953f](https://github.com/SphericalKat/rush-hour/commit/923953f61bc46d343ae0760510bfd2fa5fb63b23))
* **deps:** update module github.com/alicebob/miniredis/v2 to v2.37.0 ([e2aede4](https://github.com/SphericalKat/rush-hour/commit/e2aede497a31a1dcdea8d59d97cf64a7a2ff0a02))
* **deps:** update module github.com/alicebob/miniredis/v2 to v2.37.0 ([f42f58b](https://github.com/SphericalKat/rush-hour/commit/f42f58b87e6ece8ab4c9e6efc4c988924a068995))
* **deps:** update module github.com/go-chi/chi/v5 to v5.2.5 ([c0cb191](https://github.com/SphericalKat/rush-hour/commit/c0cb19171db56fcb177848694f05e2483f68cdee))
* **deps:** update module github.com/go-chi/chi/v5 to v5.2.5 ([6caa54d](https://github.com/SphericalKat/rush-hour/commit/6caa54db325ff4819b88b7eca4185183181a95a8))
* **deps:** update module github.com/knadh/koanf/parsers/toml to v2 ([695d729](https://github.com/SphericalKat/rush-hour/commit/695d729f1f54107c3ad4498ea1cfdeb1c69cd81e))
* **deps:** update module github.com/knadh/koanf/parsers/toml to v2 ([9cb4bb1](https://github.com/SphericalKat/rush-hour/commit/9cb4bb1c9b922926480faaef0f613082c1f7e309))
* **deps:** update module github.com/knadh/koanf/parsers/toml to v2 ([f9364d4](https://github.com/SphericalKat/rush-hour/commit/f9364d40404694f4c54c5bc9393f965ea6c2a456))
* **deps:** update module github.com/knadh/koanf/parsers/toml to v2 ([1a0ef63](https://github.com/SphericalKat/rush-hour/commit/1a0ef6387b07b44dec7c45efaafe85e4d894d066))
* **deps:** update module github.com/knadh/koanf/providers/env to v2 ([00d669a](https://github.com/SphericalKat/rush-hour/commit/00d669a9c7e11f491ef4b7d4cd8553103278f203))
* **deps:** update module github.com/knadh/koanf/providers/env to v2 ([4d39d01](https://github.com/SphericalKat/rush-hour/commit/4d39d01fd4e0094d27897683a183c8748d23476f))
* **deps:** update module github.com/knadh/koanf/providers/env to v2 ([77d12be](https://github.com/SphericalKat/rush-hour/commit/77d12be40a25674672e555d7e52d5527ed889cf9))
* **deps:** update module github.com/knadh/koanf/providers/env to v2 ([a23c585](https://github.com/SphericalKat/rush-hour/commit/a23c585f09f6d87755699ac13d5b363753ea0706))
* **deps:** update module github.com/knadh/koanf/v2 to v2.3.4 ([112bc2a](https://github.com/SphericalKat/rush-hour/commit/112bc2ac8cc7e59f503506a9556ad9e720a9eb00))
* **deps:** update module github.com/knadh/koanf/v2 to v2.3.4 ([7d8d921](https://github.com/SphericalKat/rush-hour/commit/7d8d9212f8bc19b9a87948ad05b985542dc6951a))
* **deps:** update module github.com/redis/go-redis/v9 to v9.18.0 ([6352c0d](https://github.com/SphericalKat/rush-hour/commit/6352c0d6a6cb7f95ca0a380fc16d3bf351e518a7))
* **deps:** update module github.com/redis/go-redis/v9 to v9.18.0 ([5a7c9a2](https://github.com/SphericalKat/rush-hour/commit/5a7c9a21d80359617f262d9f4d1a651f30ec0aff))
* **deps:** update module modernc.org/sqlite to v1.46.1 ([1356a60](https://github.com/SphericalKat/rush-hour/commit/1356a603fcb81f84e514082973121b0347f8d044))
* **deps:** update module modernc.org/sqlite to v1.46.1 ([9a2f1ae](https://github.com/SphericalKat/rush-hour/commit/9a2f1aeb602e6ebb3559982cac3daac94294b759))
* **deps:** update module modernc.org/sqlite to v1.48.0 ([7924021](https://github.com/SphericalKat/rush-hour/commit/79240216870904dc54f98a51ee4c64c3609edec9))
* **deps:** update module modernc.org/sqlite to v1.48.0 ([f7e894f](https://github.com/SphericalKat/rush-hour/commit/f7e894f8a3d4f05b451b0a092aa8065c1da17ef5))
* **deps:** update module modernc.org/sqlite to v1.48.1 ([3449876](https://github.com/SphericalKat/rush-hour/commit/34498769ed175f95a0ec4d3d92e3f46932efa874))
* **deps:** update module modernc.org/sqlite to v1.48.1 ([1af1722](https://github.com/SphericalKat/rush-hour/commit/1af17228c9d6fde1b7f3499849c616a0ad51410d))
* **deps:** update react monorepo to v19.2.4 ([3437e32](https://github.com/SphericalKat/rush-hour/commit/3437e320b2cdf974960d6546e2e340654fc0bb15))
* **deps:** update react monorepo to v19.2.4 ([63f0160](https://github.com/SphericalKat/rush-hour/commit/63f0160faa590a91fa5e28270129f93e1f13cc25))
* **deps:** update react monorepo to v19.2.6 ([2c4dddd](https://github.com/SphericalKat/rush-hour/commit/2c4dddd76c7e223248e25a7c74577be1bb0488a9))
* **deps:** update react monorepo to v19.2.6 ([78a52a8](https://github.com/SphericalKat/rush-hour/commit/78a52a84779442c7fbe4eda150ac4d7ea618f9f9))
* **favorites:** set pending route then navigate ([f0f56f1](https://github.com/SphericalKat/rush-hour/commit/f0f56f138236aebf5db27e0f05de0d37eceb8c2e))
* **favorites:** show train timing instead of train number ([46f9ea5](https://github.com/SphericalKat/rush-hour/commit/46f9ea5e613af6c3bc6028ec74275fbc049b7919))
* **ios:** force navbar to follow app darkness ([a69e9d1](https://github.com/SphericalKat/rush-hour/commit/a69e9d1a918ef02712fe153a8dada34aeaefef85))
* lazy-load expo-notifications to avoid crash on fdroid ([f242f9e](https://github.com/SphericalKat/rush-hour/commit/f242f9e60e4e04cf43f043a2650a7d13a74d0331))
* **mobile:** bug causing selected station names to not be shown ([ba712d8](https://github.com/SphericalKat/rush-hour/commit/ba712d8a5b6f1c781521647669546a7746cb9a0b))
* **mobile:** dark mode header, status bar, timeline states, use API delay ([9a28c52](https://github.com/SphericalKat/rush-hour/commit/9a28c524840fce2d47267aec8032394160e1a06c))
* **mobile:** embed DM Sans via config plugin with proper weight mapping ([4f01cac](https://github.com/SphericalKat/rush-hour/commit/4f01cac09ee7c2dbd073e5f0a15d812c1856538e))
* **mobile:** make share location card tappable ([5ccc83f](https://github.com/SphericalKat/rush-hour/commit/5ccc83fe81ecbc39b8ca9decc02ec79082b41b9f))
* **mobile:** prevent flash on departure and live data refresh ([eeca769](https://github.com/SphericalKat/rush-hour/commit/eeca7697707b24f5687c638da93ab46e6e3342ab))
* **mobile:** replace spring with timing for card press animations ([af7d562](https://github.com/SphericalKat/rush-hour/commit/af7d56211bfb128279772001468615315f5b8416))
* **parser:** deduplicate stations with differently-cased names ([12801a6](https://github.com/SphericalKat/rush-hour/commit/12801a6e189f22d0e7ce2bccbc9e3b3877ddb684))
* **parser:** detect AC trains from extra field ([c532876](https://github.com/SphericalKat/rush-hour/commit/c532876f6a4f6448100badd34d2adac6c271f1dc))
* **parser:** extract terminuses correctly ([0f1885d](https://github.com/SphericalKat/rush-hour/commit/0f1885dd73d7bfb4bab450c0f74ee2b319d5e73f))
* **parser:** only read files from the index ([e78b049](https://github.com/SphericalKat/rush-hour/commit/e78b04982fcd7cb5249f72cae0ca6a9d8e9fecfb))
* **parser:** remove duplicates and add indices ([92d8152](https://github.com/SphericalKat/rush-hour/commit/92d81522f0d869cb66fec6305cf0ef5075d553b1))
* **release:** checkout repo before running app.json update ([448a08d](https://github.com/SphericalKat/rush-hour/commit/448a08dd8372ac92af175141aede09ef589e2b20))
* **release:** update app.json versioncode on release ([aa0a556](https://github.com/SphericalKat/rush-hour/commit/aa0a556884edd35203022bb14813d994345b1aa9))
* remove ndk/splits conflict from build.gradle ([2a6109b](https://github.com/SphericalKat/rush-hour/commit/2a6109b1293c53e46d925d007c3b5733a6b9d360))
* set release-please manifest to current version 0.5.1 ([06b1fd2](https://github.com/SphericalKat/rush-hour/commit/06b1fd29709a93ca0a85f915522efc01982536a0))
* **settings:** add visual indicator of saved server url ([bdaab32](https://github.com/SphericalKat/rush-hour/commit/bdaab32df08a8fb9b4372aaba153a136bb319b14))
* **tabs:** inherit app theme color ([a3e5775](https://github.com/SphericalKat/rush-hour/commit/a3e5775e63be05cfeccaed042a0cbef86f7f778e))
* **timetable:** get rid of windows ([3c59137](https://github.com/SphericalKat/rush-hour/commit/3c591377f4a990292c60e2b2b7a1b81979a65dcc))
* **treewide:** use appropriate spacing for top bar ([71b7396](https://github.com/SphericalKat/rush-hour/commit/71b739603069495708b9ea6b831ccc779da677fe))
* **ui:** make ripples visible by moving them to foreground ([ba1c388](https://github.com/SphericalKat/rush-hour/commit/ba1c3886dfa05cbbcb24b229bbace0deafebe367))
* **vibration:** fix vibration on ios ([1e473bd](https://github.com/SphericalKat/rush-hour/commit/1e473bd81bb14a229f16bd4b03c08fbedff0d09d))

## [0.11.0](https://github.com/SphericalKat/rush-hour/compare/v0.10.0...v0.11.0) (2026-04-09)


### Features

* **nav:** use native navigation bars on android/ios ([a254af7](https://github.com/SphericalKat/rush-hour/commit/a254af74a80580b85a34257a3d7fa62a16c98008))


### Bug Fixes

* **deps:** update module modernc.org/sqlite to v1.48.1 ([d8d2799](https://github.com/SphericalKat/rush-hour/commit/d8d2799559e4b2cc117045d236142a2f01b498fc))
* **deps:** update module modernc.org/sqlite to v1.48.1 ([5910bdb](https://github.com/SphericalKat/rush-hour/commit/5910bdba5279c723e2ae85ca2080b23acd3e84ef))
* **ios:** force navbar to follow app darkness ([83b027e](https://github.com/SphericalKat/rush-hour/commit/83b027e661d83924b003b512f0e2034563ceac65))
* **tabs:** inherit app theme color ([838c8ee](https://github.com/SphericalKat/rush-hour/commit/838c8eecf465bd2e82d53e83dc6021a01cddd7ea))

## [0.10.0](https://github.com/SphericalKat/rush-hour/compare/v0.9.1...v0.10.0) (2026-04-02)


### Features

* **ios:** create release configs and icons ([5da131c](https://github.com/SphericalKat/rush-hour/commit/5da131c8c5f648b0e31ea2a07fcdfa832bcdda1e))


### Bug Fixes

* **android:** prevent creating multiple signing blocks ([f2b92d1](https://github.com/SphericalKat/rush-hour/commit/f2b92d1331ad2ff665f06ad2a2f87a050916e789))
* **deps:** update dependency react-native-gesture-handler to ~2.31.0 ([cbff40f](https://github.com/SphericalKat/rush-hour/commit/cbff40fbdd29edd308736243d115146e0fccf8db))
* **deps:** update dependency react-native-gesture-handler to ~2.31.0 ([8e84ec9](https://github.com/SphericalKat/rush-hour/commit/8e84ec9aa3366e16d9ec693b0536e15602da587b))
* **vibration:** fix vibration on ios ([74af1da](https://github.com/SphericalKat/rush-hour/commit/74af1dae71260146b79ea0e64d41d3364aad8895))

## [0.9.1](https://github.com/SphericalKat/rush-hour/compare/v0.9.0...v0.9.1) (2026-04-01)


### Bug Fixes

* **deps:** update dependency react-native-reanimated to v4.3.0 ([28e1737](https://github.com/SphericalKat/rush-hour/commit/28e1737adeeafe435a11f696757d983586035795))
* **deps:** update dependency react-native-reanimated to v4.3.0 ([2335958](https://github.com/SphericalKat/rush-hour/commit/2335958033eae40a9ba311132d39690917e63057))
* **deps:** update dependency react-native-worklets to v0.8.1 ([bfc524c](https://github.com/SphericalKat/rush-hour/commit/bfc524c7be0e21c8f89e987d4f98a3730c039e66))
* **deps:** update dependency react-native-worklets to v0.8.1 ([6f41eea](https://github.com/SphericalKat/rush-hour/commit/6f41eea94221df9c6ae1993d97a115a564d307f3))
* **deps:** update module github.com/knadh/koanf/parsers/toml to v2 ([d0d151a](https://github.com/SphericalKat/rush-hour/commit/d0d151ae07c76c672c541ca7ed8cca3c29f78e29))
* **deps:** update module github.com/knadh/koanf/providers/env to v2 ([784e5eb](https://github.com/SphericalKat/rush-hour/commit/784e5eb5a3fa70502cccd9d3bdaa1ddbe982d69a))
* **deps:** update module github.com/knadh/koanf/v2 to v2.3.4 ([a5a7ce7](https://github.com/SphericalKat/rush-hour/commit/a5a7ce79833bd2684ff494b6c8eef81bcf68b947))
* **deps:** update module github.com/knadh/koanf/v2 to v2.3.4 ([5c90ce9](https://github.com/SphericalKat/rush-hour/commit/5c90ce9104d3fa38f08aa307616c88b75f64cae1))
* **deps:** update module modernc.org/sqlite to v1.48.0 ([274924d](https://github.com/SphericalKat/rush-hour/commit/274924df9f1fb73082ccadefa23fa3c3413e843f))
* **deps:** update module modernc.org/sqlite to v1.48.0 ([2b039dd](https://github.com/SphericalKat/rush-hour/commit/2b039dda66f008ccfd80b7c7c21ad968c379720b))

## [0.9.0](https://github.com/SphericalKat/rush-hour/compare/v0.8.0...v0.9.0) (2026-03-15)


### Features

* **routes:** allow routes with transfers ([173b63c](https://github.com/SphericalKat/rush-hour/commit/173b63c94276b67f1023a8327e23ad0901ccfdf5))


### Bug Fixes

* **ci:** set expo distribution to play ([ef5e58f](https://github.com/SphericalKat/rush-hour/commit/ef5e58f984e5edd88b9085ee832a888e347ae49e))
* **favorites:** set pending route then navigate ([44dddbb](https://github.com/SphericalKat/rush-hour/commit/44dddbb03cf85829e4ad9ae554e3363a2be3f739))
* **ui:** make ripples visible by moving them to foreground ([f2a1309](https://github.com/SphericalKat/rush-hour/commit/f2a130938520dedb3c2a590bbb0043bfcd3d5137))

## [0.8.0](https://github.com/SphericalKat/rush-hour/compare/v0.7.0...v0.8.0) (2026-03-13)


### Features

* **departures:** grey out trains not running on a given day ([dca083b](https://github.com/SphericalKat/rush-hour/commit/dca083b527a3141fc82d350f0e6e4824ba845966))
* **mobile:** add light pink bg to ladies special trains ([42864e4](https://github.com/SphericalKat/rush-hour/commit/42864e424b1db1811b74c591d82c37e481c47d42))

## [0.7.0](https://github.com/SphericalKat/rush-hour/compare/v0.6.0...v0.7.0) (2026-03-13)


### Features

* allow searching by station code ([7bce8b4](https://github.com/SphericalKat/rush-hour/commit/7bce8b4d8eba9e1595c509f17cc7599fd1a16bdb))


### Bug Fixes

* **parser:** only read files from the index ([7ee2798](https://github.com/SphericalKat/rush-hour/commit/7ee2798e7ac7bb031244ca5959441d55b67d6abf))
