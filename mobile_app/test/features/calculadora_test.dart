import 'package:flutter_test/flutter_test.dart';
import 'package:sigo_ollas/features/calculadora/domain/resultado_preparacion.dart';

void main() {
  group('ResultadoPreparacion.desdeJson', () {
    test('mapea el resultado con un ingrediente faltante', () {
      final Map<String, dynamic> inputJson = <String, dynamic>{
        'receta': <String, dynamic>{'nombre': 'Lentejas', 'racionesEstimadas': 50},
        'personas': 180,
        'fuentePersonas': 'manual',
        'racionesPosiblesConStock': 100,
        'alcanzaParaTodos': false,
        'ingredientes': <dynamic>[
          <String, dynamic>{'nombre': 'Aceite', 'unidad': 'L', 'necesario': 3.6, 'stockActual': 2, 'faltante': 1.6, 'alcanza': false},
        ],
        'resumen': <String, dynamic>{'totalIngredientes': 1, 'ingredientesFaltantes': 1},
      };
      final ResultadoPreparacion actual = ResultadoPreparacion.desdeJson(inputJson);
      expect(actual.nombreReceta, 'Lentejas');
      expect(actual.personas, 180);
      expect(actual.personasDesdePadron, isFalse);
      expect(actual.alcanzaParaTodos, isFalse);
      expect(actual.ingredientes.single.faltante, 1.6);
      expect(actual.ingredientesFaltantes, 1);
    });

    test('detecta cuando las personas vienen del padrón', () {
      final ResultadoPreparacion actual = ResultadoPreparacion.desdeJson(<String, dynamic>{
        'receta': <String, dynamic>{'nombre': 'Arroz', 'racionesEstimadas': 40},
        'personas': 142,
        'fuentePersonas': 'padron',
        'racionesPosiblesConStock': 200,
        'alcanzaParaTodos': true,
        'ingredientes': <dynamic>[],
        'resumen': <String, dynamic>{'totalIngredientes': 0, 'ingredientesFaltantes': 0},
      });
      expect(actual.personasDesdePadron, isTrue);
      expect(actual.alcanzaParaTodos, isTrue);
    });
  });
}
