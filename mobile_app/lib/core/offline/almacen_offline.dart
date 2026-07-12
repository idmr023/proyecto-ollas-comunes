import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Operacion de escritura guardada para reintentar cuando vuelva la conexion.
class MutacionOffline {
  const MutacionOffline({
    required this.id,
    required this.metodo,
    required this.ruta,
    required this.creadaEn,
    this.cuerpo,
  });

  final String id;
  final String metodo;
  final String ruta;
  final DateTime creadaEn;
  final Object? cuerpo;

  Map<String, dynamic> aJson() => <String, dynamic>{
    'id': id,
    'metodo': metodo,
    'ruta': ruta,
    'creadaEn': creadaEn.toIso8601String(),
    if (cuerpo != null) 'cuerpo': cuerpo,
  };

  static MutacionOffline desdeJson(Map<String, dynamic> json) {
    return MutacionOffline(
      id: json['id'] as String,
      metodo: json['metodo'] as String,
      ruta: json['ruta'] as String,
      creadaEn: DateTime.parse(json['creadaEn'] as String),
      cuerpo: json['cuerpo'],
    );
  }
}

/// Contrato minimo para persistencia clave/valor.
abstract class PersistenciaOffline {
  Future<String?> leer(String clave);
  Future<void> escribir(String clave, String valor);
}

/// Adaptador de almacenamiento cifrado del dispositivo.
class PersistenciaSecureStorage implements PersistenciaOffline {
  PersistenciaSecureStorage(this._storage);

  final FlutterSecureStorage _storage;

  @override
  Future<String?> leer(String clave) => _storage.read(key: clave);

  @override
  Future<void> escribir(String clave, String valor) {
    return _storage.write(key: clave, value: valor);
  }
}

/// Cachea lecturas y conserva una cola simple de mutaciones pendientes.
class AlmacenOffline {
  AlmacenOffline(this._persistencia);

  static const String _prefijoCache = 'offline_cache:';
  static const String _claveMutaciones = 'offline_mutaciones';

  final PersistenciaOffline _persistencia;

  Future<void> guardarCache(String clave, Object? datos) async {
    await _persistencia.escribir('$_prefijoCache$clave', jsonEncode(datos));
  }

  Future<Object?> leerCache(String clave) async {
    final String? valor = await _persistencia.leer('$_prefijoCache$clave');
    if (valor == null || valor.isEmpty) return null;
    return jsonDecode(valor);
  }

  Future<void> agregarMutacion({
    required String metodo,
    required String ruta,
    Object? cuerpo,
  }) async {
    final List<MutacionOffline> mutaciones = await listarMutaciones();
    final DateTime ahora = DateTime.now().toUtc();
    mutaciones.add(
      MutacionOffline(
        id: '${ahora.microsecondsSinceEpoch}-${mutaciones.length}',
        metodo: metodo,
        ruta: ruta,
        creadaEn: ahora,
        cuerpo: cuerpo,
      ),
    );
    await _guardarMutaciones(mutaciones);
  }

  Future<List<MutacionOffline>> listarMutaciones() async {
    final String? valor = await _persistencia.leer(_claveMutaciones);
    if (valor == null || valor.isEmpty) return <MutacionOffline>[];
    final List<dynamic> items = jsonDecode(valor) as List<dynamic>;
    return items
        .map(
          (dynamic item) =>
              MutacionOffline.desdeJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<void> eliminarMutacion(String id) async {
    final List<MutacionOffline> mutaciones = await listarMutaciones();
    mutaciones.removeWhere((MutacionOffline m) => m.id == id);
    await _guardarMutaciones(mutaciones);
  }

  Future<int> contarMutaciones() async => (await listarMutaciones()).length;

  Future<void> _guardarMutaciones(List<MutacionOffline> mutaciones) async {
    await _persistencia.escribir(
      _claveMutaciones,
      jsonEncode(mutaciones.map((MutacionOffline m) => m.aJson()).toList()),
    );
  }
}
