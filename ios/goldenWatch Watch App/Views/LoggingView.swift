import SwiftUI

struct LoggingView: View {
    let exercise: TrainingNode
    let onLog: (WorkoutLog) -> Void
    @Environment(\.dismiss) var dismiss
    
    @State private var sets: [Int] = [5]
    @State private var isSuccess = false
    @FocusState private var isRepsFocused: Bool
    @State private var crownRotation: Double = 5.0
    
    var totalVolume: Int {
        sets.reduce(0, +)
    }
    
    var body: some View {
        VStack(spacing: 4) {
            // Compact header
            HStack {
                Text(exercise.name)
                    .font(.headline)
                    .multilineTextAlignment(.center)
                    .lineLimit(1)
                
                Text("SET \(sets.count)")
                    .font(.caption2)
                    .foregroundColor(.blue)
                    .textCase(.uppercase)
            }
            .padding(.top, 4)
            .padding(.horizontal, 8)
            
            // Current set controls with digital crown support
            HStack(spacing: 16) {
                Button(action: {
                    if sets[sets.count - 1] > 1 {
                        sets[sets.count - 1] -= 1
                        crownRotation = Double(sets[sets.count - 1])
                    }
                }) {
                    Image(systemName: "minus.circle.fill")
                        .font(.title3)
                        .foregroundColor(.white)
                        .background(Circle().fill(Color.gray).frame(width: 28, height: 28))
                }
                .buttonStyle(.plain)
                
                Text("\(sets[sets.count - 1])")
                    .font(.system(size: 32, weight: .black))
                    .foregroundColor(.white)
                    .frame(minWidth: 50)
                    .focusable()
                    .focused($isRepsFocused)
                    .digitalCrownRotation(
                        $crownRotation,
                        from: 1,
                        through: 100,
                        by: 1,
                        sensitivity: .medium,
                        isContinuous: false,
                        isHapticFeedbackEnabled: true
                    )
                    .onAppear {
                        crownRotation = Double(sets[sets.count - 1])
                    }
                    .onChange(of: crownRotation) { newValue in
                        let newRepValue = max(1, Int(newValue.rounded()))
                        if newRepValue != sets[sets.count - 1] {
                            sets[sets.count - 1] = newRepValue
                        }
                    }
                    .onChange(of: sets[sets.count - 1]) { newValue in
                        // Sync crown rotation when sets change via buttons
                        if abs(crownRotation - Double(newValue)) > 0.5 {
                            crownRotation = Double(newValue)
                        }
                    }
                
                Button(action: {
                    sets[sets.count - 1] += 1
                    crownRotation = Double(sets[sets.count - 1])
                }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title3)
                        .foregroundColor(.white)
                        .background(Circle().fill(Color.gray).frame(width: 28, height: 28))
                }
                .buttonStyle(.plain)
            }
            .padding(.vertical, 4)
            
            // Add set button
            Button(action: {
                sets.append(sets.last ?? 5)
                crownRotation = Double(sets[sets.count - 1])
            }) {
                HStack(spacing: 4) {
                    Image(systemName: "plus.circle")
                        .font(.caption)
                    Text("ADD SET")
                        .font(.caption2)
                        .textCase(.uppercase)
                }
                .foregroundColor(.gray)
                .padding(.vertical, 6)
                .frame(maxWidth: .infinity)
                .background(Color.black.opacity(0.1))
                .cornerRadius(6)
            }
            .padding(.horizontal, 8)
            
            Spacer()
            
            // Confirm button
            Button(action: {
                confirmLog()
            }) {
                VStack(spacing: 2) {
                    Text("CONFIRM LOG")
                        .font(.caption2)
                        .fontWeight(.black)
                        .textCase(.uppercase)
                    Text("Total: \(totalVolume)")
                        .font(.system(size: 9))
                        .opacity(0.8)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color(hex: exercise.color))
                .cornerRadius(10)
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 4)
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

