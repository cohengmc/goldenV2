import Foundation

struct TrainingNode: Codable, Identifiable {
    let id: String
    var name: String
    var color: String
    var value: Double?
    var level: Int
    var children: [TrainingNode]?
    var description: String?
    
    var isLeaf: Bool {
        return children == nil || children?.isEmpty == true
    }
}

