import 'package:flutter_test/flutter_test.dart';
import 'package:sigo_ollas/core/offline/almacen_offline.dart';
import 'package:sigo_ollas/core/red/cliente_http.dart';

class _PersistenciaMemoria implements PersistenciaOffline {
  final Map<String, String> _datos = <String, String>{};

  @override
  Future<String?> leer(String clave) async => _datos[clave];

  @override
  Future<void> escribir(String clave, String valor) async {
    _datos[clave] = valor;
  }
}

void main() {
  group('AlmacenOffline', () {
    test('guarda y lee cache JSON', () async {
      final AlmacenOffline almacen = AlmacenOffline(_PersistenciaMemoria());

      await almacen.guardarCache('/mobile/dashboard', <String, dynamic>{
        'nombreOlla': 'Olla Central',
        'racionesEntregadas': 12,
      });

      final Object? cache = await almacen.leerCache('/mobile/dashboard');

      expect(cache, isA<Map<String, dynamic>>());
      final Map<String, dynamic> datos = cache! as Map<String, dynamic>;
      expect(datos['nombreOlla'], 'Olla Central');
      expect(datos['racionesEntregadas'], 12);
    });

    test('mantiene mutaciones pendientes en orden FIFO', () async {
      final AlmacenOffline almacen = AlmacenOffline(_PersistenciaMemoria());

      await almacen.agregarMutacion(
        metodo: 'POST',
        ruta: '/mobile/deliveries',
        cuerpo: <String, dynamic>{
          'beneficiaryIds': <String>['b1', 'b2'],
        },
      );
      await almacen.agregarMutacion(
        metodo: 'POST',
        ruta: '/mobile/inventory/movements',
        cuerpo: <String, dynamic>{'supplyItemId': 'i1'},
      );

      final List<MutacionOffline> mutaciones = await almacen.listarMutaciones();

      expect(mutaciones, hasLength(2));
      expect(mutaciones.first.ruta, '/mobile/deliveries');
      expect(mutaciones.last.ruta, '/mobile/inventory/movements');
      expect(await almacen.contarMutaciones(), 2);
    });

    test('elimina una mutacion sincronizada sin tocar las demas', () async {
      final AlmacenOffline almacen = AlmacenOffline(_PersistenciaMemoria());

      await almacen.agregarMutacion(metodo: 'POST', ruta: '/mobile/deliveries');
      await almacen.agregarMutacion(
        metodo: 'POST',
        ruta: '/mobile/documents/upload',
      );
      final String idPrimera = (await almacen.listarMutaciones()).first.id;

      await almacen.eliminarMutacion(idPrimera);

      final List<MutacionOffline> restantes = await almacen.listarMutaciones();
      expect(restantes, hasLength(1));
      expect(restantes.single.ruta, '/mobile/documents/upload');
    });
  });

  group('ClienteHttp offline helpers', () {
    test('normaliza la clave de cache ordenando query params', () {
      final String a = ClienteHttp.claveCacheHttp(
        '/beneficiaries',
        query: <String, dynamic>{'query': 'ana maria', 'page': 1},
      );
      final String b = ClienteHttp.claveCacheHttp(
        '/beneficiaries',
        query: <String, dynamic>{'page': 1, 'query': 'ana maria'},
      );

      expect(a, b);
      expect(a, '/beneficiaries?page=1&query=ana+maria');
    });
  });
}
