import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/tema/colores_app.dart';
import '../../../shared/widgets/estados/lista_esqueleto.dart';
import '../../../shared/widgets/estados/vista_error.dart';
import '../../../shared/widgets/estados/vista_vacia.dart';
import '../../../shared/widgets/modales/modal_error.dart';
import '../../../shared/widgets/modales/modal_exito.dart';
import '../domain/sugerencia_menu.dart';
import 'controller_menu_ia.dart';
import 'estado_menu_ia.dart';

/// Pantalla con las sugerencias de menú generadas según inventario y padrón.
@RoutePage(name: 'MenuIaRoute')
class PaginaMenuIa extends ConsumerStatefulWidget {
  const PaginaMenuIa({super.key});

  @override
  ConsumerState<PaginaMenuIa> createState() => _PaginaMenuIaState();
}

class _PaginaMenuIaState extends ConsumerState<PaginaMenuIa> {
  String? _aprobandoId;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(
      () => ref.read(controllerMenuIaProvider.notifier).cargar(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final EstadoMenuIa estado = ref.watch(controllerMenuIaProvider);
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
          'Sugerencias de menú',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: ColoresApp.textoPrincipal,
          ),
        ),
        centerTitle: false,
      ),
      body: switch (estado) {
        MenuIaError(:final String mensaje) => VistaError(
          mensaje: mensaje,
          onReintentar: () =>
              ref.read(controllerMenuIaProvider.notifier).cargar(),
        ),
        MenuIaExito(:final List<SugerenciaMenu> sugerencias) => _lista(
          sugerencias,
        ),
        _ => const ListaEsqueleto(),
      },
    );
  }

  Future<void> _aprobar(SugerenciaMenu sugerencia) async {
    setState(() => _aprobandoId = sugerencia.id);
    final String? error = await ref
        .read(controllerMenuIaProvider.notifier)
        .aprobar(sugerencia);
    if (!mounted) return;
    setState(() => _aprobandoId = null);
    if (error != null) {
      await ModalError.mostrar(context, mensaje: error);
      return;
    }
    await ModalExito.mostrar(
      context,
      mensaje: 'El menu quedo aprobado para la operacion de hoy.',
    );
    if (!mounted) return;
    context.router.maybePop();
  }

  Widget _lista(List<SugerenciaMenu> sugerencias) {
    if (sugerencias.isEmpty) {
      return const VistaVacia(
        icono: Icons.restaurant_menu_rounded,
        titulo: 'Sin sugerencias',
        mensaje:
            'No hay sugerencias de menú por ahora. Verifica tu inventario.',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      itemCount: sugerencias.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (_, int i) => _TarjetaSugerencia(
        sugerencia: sugerencias[i],
        aprobando: _aprobandoId == sugerencias[i].id,
        onAprobar: () => _aprobar(sugerencias[i]),
      ),
    );
  }
}

class _TarjetaSugerencia extends StatelessWidget {
  const _TarjetaSugerencia({
    required this.sugerencia,
    required this.aprobando,
    required this.onAprobar,
  });

  final SugerenciaMenu sugerencia;
  final bool aprobando;
  final VoidCallback onAprobar;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  sugerencia.nombre,
                  style: const TextStyle(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w800,
                    color: ColoresApp.textoPrincipal,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              _Puntaje(valor: sugerencia.puntaje),
            ],
          ),
          if (sugerencia.ingredientes.isNotEmpty) ...<Widget>[
            const SizedBox(height: 12),
            Wrap(
              spacing: 7,
              runSpacing: 7,
              children: sugerencia.ingredientes
                  .map(
                    (String ing) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 11,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: ColoresApp.superficieAlterna,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        ing,
                        style: const TextStyle(
                          fontSize: 12.5,
                          color: ColoresApp.textoSecundario,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: aprobando ? null : onAprobar,
            icon: aprobando
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.check_circle_outline_rounded),
            label: Text(aprobando ? 'Aprobando...' : 'Aprobar menu de hoy'),
          ),
        ],
      ),
    );
  }
}

class _Puntaje extends StatelessWidget {
  const _Puntaje({required this.valor});

  final int valor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
      decoration: BoxDecoration(
        color: ColoresApp.primarioSuave,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(
            Icons.auto_awesome_rounded,
            size: 14,
            color: ColoresApp.primario,
          ),
          const SizedBox(width: 5),
          Text(
            '$valor',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: ColoresApp.primarioOscuro,
            ),
          ),
        ],
      ),
    );
  }
}
