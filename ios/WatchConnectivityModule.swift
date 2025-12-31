import Foundation
import WatchConnectivity
import React

@objc(WatchConnectivityModule)
class WatchConnectivityModule: RCTEventEmitter, WCSessionDelegate {
  private var session: WCSession?
  
  override init() {
    super.init()
    if WCSession.isSupported() {
      session = WCSession.default
      session?.delegate = self
      session?.activate()
    }
  }
  
  @objc
  override class func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func supportedEvents() -> [String]! {
    return ["WatchMessageReceived"]
  }
  
  @objc
  func initializeWatchConnectivity(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    if WCSession.isSupported() {
      session = WCSession.default
      session?.delegate = self
      session?.activate()
      resolve(true)
    } else {
      reject("NOT_SUPPORTED", "WatchConnectivity is not supported on this device", nil)
    }
  }
  
  @objc
  func sendMessageToWatch(_ message: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let session = session, session.isReachable else {
      reject("NOT_REACHABLE", "Watch is not reachable", nil)
      return
    }
    
    session.sendMessage(message, replyHandler: { reply in
      resolve(reply)
    }, errorHandler: { error in
      reject("SEND_ERROR", error.localizedDescription, error)
    })
  }
  
  // MARK: - WCSessionDelegate
  
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if let error = error {
      print("WatchConnectivity activation error: \(error.localizedDescription)")
    } else {
      print("WatchConnectivity activated with state: \(activationState.rawValue)")
    }
  }
  
  func sessionDidBecomeInactive(_ session: WCSession) {
    print("WatchConnectivity session became inactive")
  }
  
  func sessionDidDeactivate(_ session: WCSession) {
    print("WatchConnectivity session deactivated")
    session.activate()
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
    sendEvent(withName: "WatchMessageReceived", body: message)
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
    sendEvent(withName: "WatchMessageReceived", body: message)
    replyHandler(["status": "received"])
  }
}

