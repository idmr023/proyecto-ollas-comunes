import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/tema/colores_app.dart';
import '../../domain/entidades/insumo.dart';
import '../widgets/chip_estado_stock.dart';

/// Detalle de un insumo del inventario.
@RoutePage(name: 'DetalleInsumoRoute')
class PaginaDetalleInsumo extends StatelessWidget {
  const PaginaDetalleInsumo({super.key, required this.insumo});

  final Insumo insumo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      appBar: AppBar(
        backgroundColor: ColoresApp.fondo,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.chevron_left_rounded,
            color: ColoresApp.textoPrincipal,
          ),
          onPressed: () => context.router.maybePop(),
        ),
        title: const Text(
          'Detalle del insumo',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: ColoresApp.textoPrincipal,
          ),
        ),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 6, 20, 24),
        children: <Widget>[
          _TarjetaPrincipal(insumo: insumo),
          const SizedBox(height: 14),
          _TarjetaDatos(insumo: insumo),
          const SizedBox(height: 14),
          const _NotaHistorial(),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          child: FilledButton(
            onPressed: () =>
                context.router.push(MovimientoRoute(insumo: insumo)),
            child: const Text('Registrar movimiento'),
          ),
        ),
      ),
    );
  }
}

class _TarjetaPrincipal extends StatelessWidget {
  const _TarjetaPrincipal({required this.insumo});

  final Insumo insumo;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Column(
        children: <Widget>[
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: ColoresApp.superficieAlterna,
              borderRadius: BorderRadius.circular(18),
            ),
            alignment: Alignment.center,
            child: Text(
              insumo.inicial,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 24,
                color: ColoresApp.verdeMedio,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(insumo.nombre, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          ChipEstadoStock(estado: insumo.estado),
        ],
      ),
    );
  }
}

class _TarjetaDatos extends StatelessWidget {
  const _TarjetaDatos({required this.insumo});

  final Insumo insumo;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Column(
        children: <Widget>[
          _Fila(
            etiqueta: 'Cantidad actual',
            valor: '${insumo.cantidadFormateada} ${insumo.unidad}',
            conBorde: true,
          ),
          _Fila(
            etiqueta: 'Unidad de medida',
            valor: insumo.unidad,
            conBorde: true,
          ),
          _Fila(
            etiqueta: 'Perecedero',
            valor: insumo.esPerecedero ? 'Sí' : 'No',
            conBorde: false,
          ),
        ],
      ),
    );
  }
}

class _Fila extends StatelessWidget {
  const _Fila({
    required this.etiqueta,
    required this.valor,
    required this.conBorde,
  });

  final String etiqueta;
  final String valor;
  final bool conBorde;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(
        border: conBorde
            ? const Border(bottom: BorderSide(color: Color(0xFFF2EEE6)))
            : null,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          Text(
            etiqueta,
            style: const TextStyle(fontSize: 14, color: ColoresApp.textoTenue),
          ),
          Text(
            valor,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: ColoresApp.textoPrincipal,
            ),
          ),
        ],
      ),
    );
  }
}

class _NotaHistorial extends StatelessWidget {
  const _NotaHistorial();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ColoresApp.superficieAlterna,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Row(
        children: <Widget>[
          Icon(Icons.history_rounded, color: ColoresApp.textoTenue, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'El historial de movimientos estará disponible próximamente.',
              style: TextStyle(fontSize: 13, color: ColoresApp.textoTerciario),
            ),
          ),
        ],
      ),
    );
  }
}
