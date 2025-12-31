import SwiftUI

struct ExerciseListView: View {
    let exercises: [TrainingNode]
    let onSelect: (TrainingNode) -> Void
    
    var body: some View {
        List {
            ForEach(exercises) { exercise in
                Button(action: {
                    onSelect(exercise)
                }) {
                    HStack {
                        Text(exercise.name)
                            .font(.subheadline)
                            .foregroundColor(.primary)
                        Spacer()
                        Circle()
                            .fill(Color(hex: exercise.color))
                            .frame(width: 6, height: 6)
                    }
                }
            }
        }
        .navigationTitle("Exercises")
    }
}

