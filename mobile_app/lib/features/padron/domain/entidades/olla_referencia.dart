/// Referencia ligera a una olla común, para asignarla a un beneficiario.
class OllaReferencia {
  const OllaReferencia({required this.id, required this.nombre});

  final String id;
  final String nombre;

  factory OllaReferencia.desdeJson(Map<String, dynamic> json) {
    return OllaReferencia(
      id: json['id'] as String? ?? '',
      nombre: json['name'] as String? ?? '',
    );
  }

  @override
  bool operator ==(Object other) => other is OllaReferencia && other.id == id;

  @override
  int get hashCode => id.hashCode;
}
