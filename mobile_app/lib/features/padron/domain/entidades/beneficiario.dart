import 'condicion_salud.dart';
import 'prioridad.dart';

/// Beneficiario del padrón de la olla común, con su perfil de salud.
class Beneficiario {
  const Beneficiario({
    required this.id,
    required this.dni,
    required this.nombres,
    required this.apellidos,
    required this.fechaNacimiento,
    required this.telefono,
    required this.direccion,
    required this.ollaId,
    required this.nombreOlla,
    required this.prioridad,
    required this.condiciones,
  });

  final String id;
  final String? dni;
  final String nombres;
  final String apellidos;
  final DateTime? fechaNacimiento;
  final String? telefono;
  final String? direccion;
  final String? ollaId;
  final String? nombreOlla;
  final Prioridad prioridad;
  final List<CondicionSalud> condiciones;

  String get nombreCompleto => '$nombres $apellidos'.trim();

  bool get tieneCondiciones => condiciones.isNotEmpty;

  /// Edad en años calculada a partir de la fecha de nacimiento.
  int? get edad {
    if (fechaNacimiento == null) return null;
    final DateTime hoy = DateTime.now();
    int anios = hoy.year - fechaNacimiento!.year;
    final bool aunNoCumple = hoy.month < fechaNacimiento!.month ||
        (hoy.month == fechaNacimiento!.month && hoy.day < fechaNacimiento!.day);
    if (aunNoCumple) anios--;
    return anios;
  }

  /// Iniciales para el avatar (ej. "Elena Flores" → "EF").
  String get iniciales {
    final String a = nombres.isNotEmpty ? nombres[0] : '';
    final String b = apellidos.isNotEmpty ? apellidos[0] : '';
    final String iniciales = (a + b).toUpperCase();
    return iniciales.isEmpty ? '?' : iniciales;
  }

  factory Beneficiario.desdeJson(Map<String, dynamic> json) {
    final Map<String, dynamic>? olla = json['olla'] as Map<String, dynamic>?;
    final List<dynamic> condiciones = (json['healthConditions'] as List<dynamic>?) ?? <dynamic>[];
    return Beneficiario(
      id: json['id'] as String? ?? '',
      dni: json['dni'] as String?,
      nombres: json['firstName'] as String? ?? '',
      apellidos: json['lastName'] as String? ?? '',
      fechaNacimiento: DateTime.tryParse(json['birthDate'] as String? ?? ''),
      telefono: json['phone'] as String?,
      direccion: json['address'] as String?,
      ollaId: json['ollaId'] as String?,
      nombreOlla: olla?['name'] as String?,
      prioridad: Prioridad.desdeCodigo(json['priorityLevel'] as String?),
      condiciones: condiciones
          .map((dynamic e) => CondicionSalud.desdeJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}
