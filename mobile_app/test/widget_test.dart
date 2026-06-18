import 'package:flutter_test/flutter_test.dart';

import 'package:sigo_ollas/core/red/resultado.dart';
import 'package:sigo_ollas/core/errores/excepciones.dart';

void main() {
  group('Resultado', () {
    test('un Exito reporta esExito en verdadero y conserva el valor', () {
      const Resultado<int> resultado = Resultado<int>.exito(42);
      expect(resultado.esExito, isTrue);
      expect((resultado as Exito<int>).valor, 42);
    });

    test('un Fallo reporta esExito en falso y conserva la excepción', () {
      const Resultado<int> resultado = Resultado<int>.fallo(ExcepcionRed());
      expect(resultado.esExito, isFalse);
      expect((resultado as Fallo<int>).excepcion, isA<ExcepcionRed>());
    });
  });
}
