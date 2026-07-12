import 'package:flutter_test/flutter_test.dart';
import 'package:sigo_ollas/features/inventario/domain/entidades/estado_stock.dart';
import 'package:sigo_ollas/features/inventario/domain/entidades/insumo.dart';

void main() {
  group('EstadoStock.segunCantidad', () {
    test('marca crítico cuando la cantidad es muy baja', () {
      expect(EstadoStock.segunCantidad(0.5), EstadoStock.critico);
      expect(EstadoStock.segunCantidad(1), EstadoStock.critico);
    });

    test('marca bajo en el rango intermedio', () {
      expect(EstadoStock.segunCantidad(4), EstadoStock.bajo);
      expect(EstadoStock.segunCantidad(5), EstadoStock.bajo);
    });

    test('marca ok cuando hay stock suficiente', () {
      expect(EstadoStock.segunCantidad(120), EstadoStock.ok);
    });
  });

  group('Insumo', () {
    test('formatea la cantidad sin decimales innecesarios', () {
      const Insumo entero = Insumo(
        id: '1',
        nombre: 'Arroz',
        cantidad: 120,
        unidad: 'kg',
        esPerecedero: false,
      );
      const Insumo decimal = Insumo(
        id: '2',
        nombre: 'Sal',
        cantidad: 0.5,
        unidad: 'kg',
        esPerecedero: false,
      );
      expect(entero.cantidadFormateada, '120');
      expect(decimal.cantidadFormateada, '0.5');
    });

    test('deriva el estado a partir de la cantidad e inicial del nombre', () {
      const Insumo critico = Insumo(
        id: '3',
        nombre: 'Lentejas',
        cantidad: 1,
        unidad: 'kg',
        esPerecedero: true,
      );
      expect(critico.estado, EstadoStock.critico);
      expect(critico.inicial, 'L');
    });
  });
}
