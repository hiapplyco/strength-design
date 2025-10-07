
class Exercise {
  final String id;
  final String name;
  final String description;
  final List<String> muscleGroups;
  final List<String> equipment;
  final String videoUrl;

  Exercise({
    required this.id,
    required this.name,
    required this.description,
    required this.muscleGroups,
    required this.equipment,
    required this.videoUrl,
  });

  factory Exercise.fromMap(Map<String, dynamic> map) {
    return Exercise(
      id: map['id'],
      name: map['name'],
      description: map['description'],
      muscleGroups: List<String>.from(map['muscleGroups']),
      equipment: List<String>.from(map['equipment']),
      videoUrl: map['videoUrl'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'muscleGroups': muscleGroups,
      'equipment': equipment,
      'videoUrl': videoUrl,
    };
  }
}
