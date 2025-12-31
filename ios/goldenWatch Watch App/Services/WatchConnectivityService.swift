import Foundation
import WatchConnectivity

class WatchConnectivityService: NSObject, WCSessionDelegate {
    static let shared = WatchConnectivityService()
    
    private var session: WCSession?
    
    override init() {
        super.init()
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }
    
    func sendWorkoutLog(_ log: WorkoutLog) {
        guard let session = session, session.isReachable else {
            print("Watch: Phone is not reachable")
            return
        }
        
        let encoder = JSONEncoder()
        guard let logData = try? encoder.encode(log),
              let logDict = try? JSONSerialization.jsonObject(with: logData) as? [String: Any] else {
            print("Watch: Failed to encode workout log")
            return
        }
        
        let message: [String: Any] = [
            "type": "workoutLog",
            "data": logDict
        ]
        
        session.sendMessage(message, replyHandler: { reply in
            print("Watch: Message sent successfully, reply: \(reply)")
        }, errorHandler: { error in
            print("Watch: Error sending message: \(error.localizedDescription)")
        })
    }
    
    // MARK: - WCSessionDelegate
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("Watch: WatchConnectivity activation error: \(error.localizedDescription)")
        } else {
            print("Watch: WatchConnectivity activated with state: \(activationState.rawValue)")
        }
    }
}

