/// Sugerencia de menú generada según el inventario y los beneficiarios.
class SugerenciaMenu {
  const SugerenciaMenu({
    required this.id,
    required this.nombre,
    required this.puntaje,
    required this.ingredientes,
  });

  final String id;
  final String nombre;
  final int puntaje;
  final List<String> ingredientes;

  factory SugerenciaMenu.desdeJson(Map<String, dynamic> json) {
    final List<dynamic> ingredientes = (json['ingredientes'] as List<dynamic>?) ?? <dynamic>[];
    return SugerenciaMenu(
      id: json['id'] as String? ?? '',
      nombre: json['nombre'] as String? ?? '',
      puntaje: (json['puntaje'] as num?)?.toInt() ?? 0,
      ingredientes: ingredientes.map((dynamic e) => e.toString()).toList(),
    );
  }
}
