import 'package:flutter_test/flutter_test.dart';
import 'package:sigo_ollas/features/padron/domain/datos_beneficiario.dart';
import 'package:sigo_ollas/features/padron/domain/entidades/beneficiario.dart';
import 'package:sigo_ollas/features/padron/domain/entidades/prioridad.dart';

void main() {
  group('Beneficiario.desdeJson', () {
    test('mapea nombres, prioridad, olla y condiciones', () {
      final Map<String, dynamic> inputJson = <String, dynamic>{
        'id': 'b1',
        'dni': '70020001',
        'firstName': 'Elena',
        'lastName': 'Flores',
        'birthDate': '1950-05-10T00:00:00.000Z',
        'priorityLevel': 'high',
        'olla': <String, dynamic>{'id': 'o1', 'name': 'Olla Los Olivos'},
        'healthConditions': <dynamic>[
          <String, dynamic>{'id': 1, 'name': 'Hipertensión'},
        ],
      };
      final Beneficiario actual = Beneficiario.desdeJson(inputJson);
      expect(actual.nombreCompleto, 'Elena Flores');
      expect(actual.prioridad, Prioridad.alta);
      expect(actual.nombreOlla, 'Olla Los Olivos');
      expect(actual.iniciales, 'EF');
      expect(actual.condiciones.single.nombre, 'Hipertensión');
    });

    test('calcula la edad a partir de la fecha de nacimiento', () {
      final DateTime hace40 = DateTime(DateTime.now().year - 40, 1, 1);
      final Beneficiario actual = Beneficiario.desdeJson(<String, dynamic>{
        'id': 'b2',
        'firstName': 'Ana',
        'lastName': 'Ruiz',
        'birthDate': hace40.toIso8601String(),
        'priorityLevel': 'normal',
      });
      expect(actual.edad, anyOf(39, 40));
    });
  });

  group('DatosBeneficiario.aJson', () {
    test('omite dni y ollaId vacíos y serializa el resto', () {
      final DatosBeneficiario datos = DatosBeneficiario(
        nombres: 'María',
        apellidos: 'Quispe',
        fechaNacimiento: DateTime(1972, 3, 15),
        prioridad: Prioridad.alta,
        condicionIds: <int>[1, 2],
        dni: '',
      );
      final Map<String, dynamic> json = datos.aJson();
      expect(json['firstName'], 'María');
      expect(json['priorityLevel'], 'high');
      expect(json['healthConditionIds'], <int>[1, 2]);
      expect(json.containsKey('dni'), isFalse);
      expect(json.containsKey('ollaId'), isFalse);
    });
  });
}
