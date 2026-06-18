/// Condición de salud que puede tener un beneficiario (ej. Anemia, Diabetes).
class CondicionSalud {
  const CondicionSalud({required this.id, required this.nombre});

  final int id;
  final String nombre;

  factory CondicionSalud.desdeJson(Map<String, dynamic> json) {
    return CondicionSalud(
      id: (json['id'] as num?)?.toInt() ?? 0,
      nombre: json['name'] as String? ?? '',
    );
  }

  @override
  bool operator ==(Object other) => other is CondicionSalud && other.id == id;

  @override
  int get hashCode => id.hashCode;
}
