/// Sugerencia de menú generada según el inventario y los beneficiarios.
class SugerenciaMenu {
  const SugerenciaMenu({
    required this.id,
    required this.nombre,
    required this.puntaje,
    required this.ingredientes,
    required this.ingredientesReceta,
  });

  final String id;
  final String nombre;
  final int puntaje;
  final List<String> ingredientes;
  final List<IngredienteRecetaSugerida> ingredientesReceta;

  factory SugerenciaMenu.desdeJson(Map<String, dynamic> json) {
    final List<dynamic> ingredientes =
        (json['ingredientes'] as List<dynamic>?) ?? <dynamic>[];
    final List<dynamic> ingredientesReceta =
        (json['recipeIngredients'] as List<dynamic>?) ?? <dynamic>[];
    return SugerenciaMenu(
      id: json['id'] as String? ?? '',
      nombre: json['nombre'] as String? ?? '',
      puntaje: (json['puntaje'] as num?)?.toInt() ?? 0,
      ingredientes: ingredientes.map((dynamic e) => e.toString()).toList(),
      ingredientesReceta: ingredientesReceta
          .map(
            (dynamic e) => IngredienteRecetaSugerida.desdeJson(
              Map<String, dynamic>.from(e as Map),
            ),
          )
          .toList(),
    );
  }

  List<Map<String, dynamic>> ingredientesRecetaJson() {
    return ingredientesReceta
        .map((IngredienteRecetaSugerida i) => i.aJson())
        .toList();
  }
}

class IngredienteRecetaSugerida {
  const IngredienteRecetaSugerida({
    required this.supplyItemId,
    required this.quantity,
  });

  final String supplyItemId;
  final double quantity;

  factory IngredienteRecetaSugerida.desdeJson(Map<String, dynamic> json) {
    return IngredienteRecetaSugerida(
      supplyItemId: json['supplyItemId'] as String? ?? '',
      quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> aJson() {
    return <String, dynamic>{
      'supplyItemId': supplyItemId,
      'quantity': quantity,
    };
  }
}
