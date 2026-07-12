import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/tema/colores_app.dart';
import '../../../shared/widgets/estados/lista_esqueleto.dart';
import '../../../shared/widgets/estados/vista_error.dart';
import '../../../shared/widgets/estados/vista_vacia.dart';
import '../domain/alerta.dart';
import 'controller_alertas.dart';
import 'estado_alertas.dart';

/// Pantalla de alertas operativas de la olla común.
@RoutePage(name: 'AlertasRoute')
class PaginaAlertas extends ConsumerStatefulWidget {
  const PaginaAlertas({super.key});

  @override
  ConsumerState<PaginaAlertas> createState() => _PaginaAlertasState();
}

class _PaginaAlertasState extends ConsumerState<PaginaAlertas> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(
      () => ref.read(controllerAlertasProvider.notifier).cargar(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final EstadoAlertas estado = ref.watch(controllerAlertasProvider);
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
          'Alertas',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: ColoresApp.textoPrincipal,
          ),
        ),
        centerTitle: false,
      ),
      body: switch (estado) {
        AlertasError(:final String mensaje) => VistaError(
          mensaje: mensaje,
          onReintentar: () =>
              ref.read(controllerAlertasProvider.notifier).cargar(),
        ),
        AlertasExito(:final List<Alerta> alertas) => _lista(alertas),
        _ => const ListaEsqueleto(),
      },
    );
  }

  Widget _lista(List<Alerta> alertas) {
    if (alertas.isEmpty) {
      return const VistaVacia(
        icono: Icons.notifications_none_rounded,
        titulo: 'Sin alertas',
        mensaje: 'No hay alertas pendientes. ¡Todo bajo control!',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      itemCount: alertas.length,
      separatorBuilder: (_, _) => const SizedBox(height: 11),
      itemBuilder: (_, int i) => _TarjetaAlerta(alerta: alertas[i]),
    );
  }
}

class _TarjetaAlerta extends StatelessWidget {
  const _TarjetaAlerta({required this.alerta});

  final Alerta alerta;

  @override
  Widget build(BuildContext context) {
    final Color color = switch (alerta.tipo) {
      TipoAlerta.stockBajo => ColoresApp.bajoPunto,
      TipoAlerta.sincronizacion => ColoresApp.saludTexto,
      TipoAlerta.general => ColoresApp.criticoPunto,
    };
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            margin: const EdgeInsets.only(top: 5),
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  alerta.titulo,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: ColoresApp.textoPrincipal,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  alerta.descripcion,
                  style: const TextStyle(
                    fontSize: 13,
                    color: ColoresApp.textoTenue,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(
            alerta.fecha,
            style: const TextStyle(
              fontSize: 12,
              color: ColoresApp.textoPlaceholder,
            ),
          ),
        ],
      ),
    );
  }
}
