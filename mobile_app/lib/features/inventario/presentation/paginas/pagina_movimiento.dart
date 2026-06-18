import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/modales/modal_error.dart';
import '../../../../shared/widgets/modales/modal_exito.dart';
import '../../domain/entidades/insumo.dart';
import '../../domain/tipo_movimiento.dart';
import '../controllers/controller_inventario.dart';
import '../controllers/controller_movimiento.dart';
import '../estado/estado_movimiento.dart';
import '../widgets/selector_tipo_movimiento.dart';
import '../widgets/stepper_cantidad.dart';

/// Pantalla para registrar un movimiento (entrada/salida) sobre un insumo.
@RoutePage(name: 'MovimientoRoute')
class PaginaMovimiento extends ConsumerStatefulWidget {
  const PaginaMovimiento({super.key, required this.insumo});

  final Insumo insumo;

  @override
  ConsumerState<PaginaMovimiento> createState() => _PaginaMovimientoState();
}

class _PaginaMovimientoState extends ConsumerState<PaginaMovimiento> {
  TipoMovimiento _tipo = TipoMovimiento.salida;
  int _cantidad = 1;
  final TextEditingController _nota = TextEditingController();

  @override
  void dispose() {
    _nota.dispose();
    super.dispose();
  }

  void _guardar() {
    if (_cantidad <= 0) return;
    ref.read(controllerMovimientoProvider.notifier).registrar(
          insumoId: widget.insumo.id,
          tipo: _tipo,
          cantidad: _cantidad.toDouble(),
          nota: _nota.text.trim(),
        );
  }

  Future<void> _reaccionar(EstadoMovimiento estado) async {
    if (estado is MovimientoExito) {
      ref.read(controllerMovimientoProvider.notifier).reiniciar();
      await ref.read(controllerInventarioProvider.notifier).cargar();
      if (!mounted) return;
      await ModalExito.mostrar(context, mensaje: 'El movimiento se registró y el stock fue actualizado.');
      if (!mounted) return;
      await context.router.maybePop();
    } else if (estado is MovimientoError) {
      ref.read(controllerMovimientoProvider.notifier).reiniciar();
      final bool reintentar = await ModalError.mostrar(context, mensaje: estado.mensaje);
      if (reintentar) _guardar();
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<EstadoMovimiento>(controllerMovimientoProvider, (_, EstadoMovimiento e) => _reaccionar(e));
    final bool guardando = ref.watch(controllerMovimientoProvider) is MovimientoGuardando;
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      appBar: AppBar(
        backgroundColor: ColoresApp.fondo,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.chevron_left_rounded, color: ColoresApp.textoPrincipal),
          onPressed: () => context.router.maybePop(),
        ),
        title: const Text('Registrar movimiento', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: ColoresApp.textoPrincipal)),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(22, 8, 22, 24),
        children: <Widget>[
          _EncabezadoInsumo(insumo: widget.insumo),
          const SizedBox(height: 22),
          const _Titulo('Tipo de movimiento'),
          const SizedBox(height: 10),
          SelectorTipoMovimiento(seleccionado: _tipo, onCambio: (TipoMovimiento t) => setState(() => _tipo = t)),
          const SizedBox(height: 22),
          const _Titulo('Cantidad'),
          const SizedBox(height: 12),
          StepperCantidad(
            valor: _cantidad,
            unidad: widget.insumo.unidad,
            onIncrementar: () => setState(() => _cantidad++),
            onDecrementar: () => setState(() => _cantidad = _cantidad > 0 ? _cantidad - 1 : 0),
          ),
          const SizedBox(height: 22),
          const _Titulo('Nota (opcional)'),
          const SizedBox(height: 10),
          TextField(
            controller: _nota,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'Ej. Almuerzo del día, donación recibida...'),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          child: FilledButton(
            onPressed: guardando ? null : _guardar,
            child: guardando
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                : const Text('Guardar movimiento'),
          ),
        ),
      ),
    );
  }
}

class _EncabezadoInsumo extends StatelessWidget {
  const _EncabezadoInsumo({required this.insumo});

  final Insumo insumo;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: ColoresApp.superficieAlterna, borderRadius: BorderRadius.circular(12)),
            alignment: Alignment.center,
            child: Text(insumo.inicial, style: const TextStyle(fontWeight: FontWeight.w800, color: ColoresApp.verdeMedio)),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(insumo.nombre, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: ColoresApp.textoPrincipal)),
              Text('Stock actual: ${insumo.cantidadFormateada} ${insumo.unidad}', style: const TextStyle(fontSize: 12.5, color: ColoresApp.textoTenue)),
            ],
          ),
        ],
      ),
    );
  }
}

class _Titulo extends StatelessWidget {
  const _Titulo(this.texto);

  final String texto;

  @override
  Widget build(BuildContext context) {
    return Text(texto, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: ColoresApp.textoSecundario));
  }
}
