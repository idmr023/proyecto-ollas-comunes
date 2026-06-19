/// Resumen de una receta para el selector de la calculadora.
class RecetaResumen {
  const RecetaResumen({
    required this.id,
    required this.nombre,
    required this.racionesEstimadas,
    required this.totalIngredientes,
  });

  final String id;
  final String nombre;
  final int racionesEstimadas;
  final int totalIngredientes;

  factory RecetaResumen.desdeJson(Map<String, dynamic> json) {
    return RecetaResumen(
      id: json['id'] as String? ?? '',
      nombre: json['nombre'] as String? ?? '',
      racionesEstimadas: (json['racionesEstimadas'] as num?)?.toInt() ?? 0,
      totalIngredientes: (json['totalIngredientes'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  bool operator ==(Object other) => other is RecetaResumen && other.id == id;

  @override
  int get hashCode => id.hashCode;
}
