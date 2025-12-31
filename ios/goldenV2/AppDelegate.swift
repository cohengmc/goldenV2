import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "goldenV2",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    let url = self.bundleURL()
    if url == nil {
      print("ERROR: Bundle URL is nil!")
    }
    return url
  }

  override func bundleURL() -> URL? {
#if DEBUG
    let provider = RCTBundleURLProvider.sharedSettings()
    // Try to get the bundle URL
    if let url = provider.jsBundleURL(forBundleRoot: "index") {
      print("Bundle URL: \(url.absoluteString)")
      return url
    }
    // Fallback: construct URL manually
    let localhost = "localhost"
    let port = 8081
    let bundleRoot = "index"
    if let url = URL(string: "http://\(localhost):\(port)/\(bundleRoot).bundle?platform=ios&dev=true") {
      print("Fallback Bundle URL: \(url.absoluteString)")
      return url
    }
    print("ERROR: Could not create bundle URL")
    return nil
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
