import 'package:flutter_test/flutter_test.dart';
import 'package:sigo_ollas/features/alertas/domain/alerta.dart';
import 'package:sigo_ollas/features/menu_ia/domain/sugerencia_menu.dart';

void main() {
  group('Alerta.desdeJson', () {
    test('mapea el tipo de stock bajo desde el código de la API', () {
      final Alerta actual = Alerta.desdeJson(<String, dynamic>{
        'id': 'a1',
        'tipo': 'bajo_stock',
        'titulo': 'Aceite bajo',
        'descripcion': 'Quedan 4 L',
        'fecha': 'Hace 1h',
      });
      expect(actual.tipo, TipoAlerta.stockBajo);
      expect(actual.titulo, 'Aceite bajo');
    });

    test('usa el tipo general para códigos desconocidos', () {
      final Alerta actual = Alerta.desdeJson(<String, dynamic>{
        'id': 'a2',
        'tipo': 'otro',
      });
      expect(actual.tipo, TipoAlerta.general);
    });
  });

  group('SugerenciaMenu.desdeJson', () {
    test('mapea nombre, puntaje e ingredientes', () {
      final SugerenciaMenu actual = SugerenciaMenu.desdeJson(<String, dynamic>{
        'id': '1',
        'nombre': 'Lentejas con arroz',
        'puntaje': 92,
        'ingredientes': <dynamic>['Lentejas', 'Arroz', 'Cebolla'],
      });
      expect(actual.nombre, 'Lentejas con arroz');
      expect(actual.puntaje, 92);
      expect(actual.ingredientes, hasLength(3));
      expect(actual.ingredientesReceta, isEmpty);
    });

    test('mapea ingredientes tecnicos para aprobar menu y descontar stock', () {
      final SugerenciaMenu actual = SugerenciaMenu.desdeJson(<String, dynamic>{
        'id': '2',
        'nombre': 'Guiso de pollo',
        'puntaje': 88,
        'ingredientes': <dynamic>['Pollo (5 kg)', 'Arroz (8 kg)'],
        'recipeIngredients': <dynamic>[
          <String, dynamic>{'supplyItemId': 'pollo-id', 'quantity': 5},
          <String, dynamic>{'supplyItemId': 'arroz-id', 'quantity': 8.5},
        ],
      });

      expect(actual.ingredientesReceta, hasLength(2));
      expect(actual.ingredientesReceta.first.supplyItemId, 'pollo-id');
      expect(actual.ingredientesRecetaJson(), <Map<String, dynamic>>[
        <String, dynamic>{'supplyItemId': 'pollo-id', 'quantity': 5.0},
        <String, dynamic>{'supplyItemId': 'arroz-id', 'quantity': 8.5},
      ]);
    });
  });
}
