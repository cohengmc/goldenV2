import Foundation

struct WorkoutLog: Codable, Identifiable {
    let id: String
    let nodeId: String
    let nodeName: String
    let date: String
    let value: Double
    let unit: String
    var notes: String?
}

