import SwiftUI

struct LoggingView: View {
    let exercise: TrainingNode
    let onLog: (WorkoutLog) -> Void
    @Environment(\.dismiss) var dismiss
    
    @State private var sets: [Int] = [5]
    @State private var isSuccess = false
    
    var totalVolume: Int {
        sets.reduce(0, +)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text(exercise.name)
                    .font(.headline)
                    .multilineTextAlignment(.center)
                    .padding(.top, 8)
                
                Text("SET \(sets.count)")
                    .font(.caption)
                    .foregroundColor(.blue)
                    .textCase(.uppercase)
                
                // Current set controls
                HStack(spacing: 20) {
                    Button(action: {
                        if sets[sets.count - 1] > 1 {
                            sets[sets.count - 1] -= 1
                        }
                    }) {
                        Image(systemName: "minus.circle.fill")
                            .font(.title2)
                            .foregroundColor(.white)
                            .background(Circle().fill(Color.gray).frame(width: 32, height: 32))
                    }
                    .buttonStyle(.plain)
                    
                    Text("\(sets[sets.count - 1])")
                        .font(.title)
                        .fontWeight(.black)
                        .foregroundColor(.white)
                        .frame(minWidth: 40)
                    
                    Button(action: {
                        sets[sets.count - 1] += 1
                    }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(.white)
                            .background(Circle().fill(Color.gray).frame(width: 32, height: 32))
                    }
                    .buttonStyle(.plain)
                }
                .padding(.vertical, 8)
                
                // Add set button
                Button(action: {
                    sets.append(sets.last ?? 5)
                }) {
                    HStack {
                        Image(systemName: "plus.circle")
                        Text("Add Set")
                            .font(.caption)
                            .textCase(.uppercase)
                    }
                    .foregroundColor(.gray)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity)
                    .background(Color.black.opacity(0.1))
                    .cornerRadius(8)
                }
                
                // Confirm button
                Button(action: {
                    confirmLog()
                }) {
                    VStack(spacing: 4) {
                        Text("CONFIRM LOG")
                            .font(.caption)
                            .fontWeight(.black)
                            .textCase(.uppercase)
                        Text("Total: \(totalVolume)")
                            .font(.system(size: 10))
                            .opacity(0.8)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color(hex: exercise.color))
                    .cornerRadius(12)
                }
            }
            .padding()
        }
        .navigationBarTitleDisplayMode(.inline)
        .overlay {
            if isSuccess {
                VStack {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.green)
                    Text("Workout Saved")
                        .font(.caption)
                        .fontWeight(.bold)
                        .textCase(.uppercase)
                        .foregroundColor(.white)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.black.opacity(0.8))
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func confirmLog() {
        let setsBreakdown = sets.map { String($0) }.joined(separator: ", ")
        let notes = "Logged from Watch\nSets: \(setsBreakdown)"
        
        let log = WorkoutLog(
            id: UUID().uuidString,
            nodeId: exercise.id,
            nodeName: exercise.name,
            date: ISO8601DateFormatter().string(from: Date()),
            value: Double(totalVolume),
            unit: "reps/sets",
            notes: notes
        )
        
        WatchConnectivityService.shared.sendWorkoutLog(log)
        onLog(log)
        
        withAnimation {
            isSuccess = true
        }
    }
}

