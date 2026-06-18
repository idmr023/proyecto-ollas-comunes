import 'entidades/prioridad.dart';

/// Datos de entrada para registrar o editar un beneficiario (patrón RO-RO).
class DatosBeneficiario {
  const DatosBeneficiario({
    required this.nombres,
    required this.apellidos,
    required this.fechaNacimiento,
    required this.prioridad,
    required this.condicionIds,
    this.dni,
    this.ollaId,
  });

  final String nombres;
  final String apellidos;
  final DateTime fechaNacimiento;
  final Prioridad prioridad;
  final List<int> condicionIds;
  final String? dni;
  final String? ollaId;

  /// Construye el cuerpo JSON que espera la API de beneficiarios.
  Map<String, dynamic> aJson() {
    return <String, dynamic>{
      'firstName': nombres,
      'lastName': apellidos,
      'birthDate': fechaNacimiento.toIso8601String(),
      'priorityLevel': prioridad.codigoApi,
      'healthConditionIds': condicionIds,
      if (dni != null && dni!.isNotEmpty) 'dni': dni,
      if (ollaId != null && ollaId!.isNotEmpty) 'ollaId': ollaId,
    };
  }
}
