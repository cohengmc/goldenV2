import SwiftUI

struct ContentView: View {
    @State private var navigationPath = NavigationPath()
    @State private var trainingData: TrainingNode = createInitialData()
    
    var body: some View {
        NavigationStack(path: $navigationPath) {
            TrainingListView(categories: trainingData.children ?? []) { category in
                if let exercises = category.children, !exercises.isEmpty {
                    navigationPath.append(category)
                }
            }
            .navigationDestination(for: TrainingNode.self) { node in
                if node.isLeaf {
                    LoggingView(exercise: node) { log in
                        // Log received, will be handled by WatchConnectivityService
                        navigationPath.removeLast(navigationPath.count)
                    }
                } else if let exercises = node.children {
                    ExerciseListView(exercises: exercises) { exercise in
                        navigationPath.append(exercise)
                    }
                }
            }
        }
        .onAppear {
            // Initialize WatchConnectivity
            _ = WatchConnectivityService.shared
        }
    }
    
    private static func createInitialData() -> TrainingNode {
        // This is a simplified version - in production, you'd load this from the phone
        // For now, we'll create a basic structure
        return TrainingNode(
            id: "root",
            name: "Training Universe",
            color: "#FFFFFF",
            level: 0,
            children: [
                TrainingNode(
                    id: "why-balanced",
                    name: "BE BALANCED",
                    color: "#e2e8f0",
                    level: 1,
                    children: [
                        TrainingNode(
                            id: "how-skill",
                            name: "Hand Balancing",
                            color: "#FF3D77",
                            level: 2,
                            children: [
                                TrainingNode(id: "what-handstand", name: "Handstand (3min Acc)", color: "#FF3D77", value: 0, level: 3),
                                TrainingNode(id: "what-balancing", name: "Hand Balancing Skill", color: "#FF3D77", value: 0, level: 3)
                            ]
                        )
                    ]
                ),
                TrainingNode(
                    id: "why-strong",
                    name: "BE STRONG",
                    color: "#cbd5e1",
                    level: 1,
                    children: [
                        TrainingNode(
                            id: "how-push",
                            name: "Pushing Strength",
                            color: "#FF0000",
                            level: 2,
                            children: [
                                TrainingNode(id: "what-hspu", name: "HSPU", color: "#FF0000", value: 0, level: 3),
                                TrainingNode(id: "what-pike-pu", name: "Pike PU", color: "#FF0000", value: 0, level: 3),
                                TrainingNode(id: "what-pushups", name: "Pushups & Dips", color: "#FF0000", value: 0, level: 3)
                            ]
                        ),
                        TrainingNode(
                            id: "how-pull",
                            name: "Pulling Strength",
                            color: "#3D99FF",
                            level: 2,
                            children: [
                                TrainingNode(id: "what-pullups", name: "Pullups", color: "#3D99FF", value: 0, level: 3),
                                TrainingNode(id: "what-deadhang", name: "Dead Hang", color: "#3D99FF", value: 0, level: 3)
                            ]
                        )
                    ]
                )
            ]
        )
    }
}

extension TrainingNode: Hashable {
    static func == (lhs: TrainingNode, rhs: TrainingNode) -> Bool {
        lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

#Preview {
    ContentView()
}
