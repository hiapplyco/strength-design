// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'analysis_result.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PoseAnalysisResultAdapter extends TypeAdapter<PoseAnalysisResult> {
  @override
  final int typeId = 0;

  @override
  PoseAnalysisResult read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PoseAnalysisResult(
      angles: (fields[0] as Map).cast<String, double>(),
      formScore: fields[1] as double,
      repPhase: fields[2] as RepPhase,
      landmarks: (fields[3] as Map).cast<MoveNetKeypoint, MoveNetLandmark>(),
    );
  }

  @override
  void write(BinaryWriter writer, PoseAnalysisResult obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.angles)
      ..writeByte(1)
      ..write(obj.formScore)
      ..writeByte(2)
      ..write(obj.repPhase)
      ..writeByte(3)
      ..write(obj.landmarks);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PoseAnalysisResultAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
