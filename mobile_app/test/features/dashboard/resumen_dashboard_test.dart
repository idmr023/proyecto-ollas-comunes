import 'package:flutter_test/flutter_test.dart';
import 'package:sigo_ollas/features/dashboard/domain/entidades/resumen_dashboard.dart';

void main() {
  group('ResumenDashboard.desdeJson', () {
    test('mapea la respuesta completa del endpoint /mobile/dashboard', () {
      final Map<String, dynamic> inputJson = <String, dynamic>{
        'olla': <String, dynamic>{'id': 'o1', 'name': 'Olla Común Los Olivos'},
        'summary': <String, dynamic>{
          'planificadas': 200,
          'entregadas': 180,
          'menu': <String, dynamic>{'dishName': 'Lentejas', 'status': 'executed', 'maxServingsRemaining': 40},
        },
        'expiring': <dynamic>[
          <String, dynamic>{'nombre': 'Leche en polvo', 'cantidad': '10 kg', 'venceEn': 'Próximamente'},
        ],
      };
      final ResumenDashboard actual = ResumenDashboard.desdeJson(inputJson);
      expect(actual.nombreOlla, 'Olla Común Los Olivos');
      expect(actual.racionesEntregadas, 180);
      expect(actual.racionesPlanificadas, 200);
      expect(actual.menuDia?.plato, 'Lentejas');
      expect(actual.insumosPorVencer, hasLength(1));
      expect(actual.insumosPorVencer.first.nombre, 'Leche en polvo');
    });

    test('usa valores por defecto cuando no hay olla ni menú', () {
      final ResumenDashboard actual = ResumenDashboard.desdeJson(<String, dynamic>{
        'olla': null,
        'summary': <String, dynamic>{'planificadas': 0, 'entregadas': 0, 'menu': null},
        'expiring': <dynamic>[],
      });
      expect(actual.nombreOlla, 'Sin olla asignada');
      expect(actual.menuDia, isNull);
      expect(actual.insumosPorVencer, isEmpty);
    });
  });
}
