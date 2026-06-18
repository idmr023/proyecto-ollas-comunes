import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/estados/vista_error.dart';
import '../../../auth/domain/entidades/usuario.dart';
import '../../domain/entidades/resumen_dashboard.dart';
import '../controllers/controller_dashboard.dart';
import '../estado/estado_dashboard.dart';
import '../widgets/tarjeta_kpi_raciones.dart';
import '../widgets/tarjeta_insumos_por_vencer.dart';
import '../widgets/accesos_rapidos.dart';

/// Contenido de la pestaña Inicio: el dashboard del día de la olla común.
class PaginaDashboard extends ConsumerStatefulWidget {
  const PaginaDashboard({super.key, this.onIrInventario, this.onIrPadron});

  final VoidCallback? onIrInventario;
  final VoidCallback? onIrPadron;

  @override
  ConsumerState<PaginaDashboard> createState() => _PaginaDashboardState();
}

class _PaginaDashboardState extends ConsumerState<PaginaDashboard> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() => ref.read(controllerDashboardProvider.notifier).cargar());
  }

  @override
  Widget build(BuildContext context) {
    final EstadoDashboard estado = ref.watch(controllerDashboardProvider);
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      body: switch (estado) {
        DashboardExito(:final Usuario usuario, :final ResumenDashboard resumen) =>
          _Contenido(usuario: usuario, resumen: resumen, onIrInventario: widget.onIrInventario, onIrPadron: widget.onIrPadron),
        DashboardError(:final String mensaje) => VistaError(
            mensaje: mensaje,
            onReintentar: () => ref.read(controllerDashboardProvider.notifier).cargar(),
          ),
        _ => const Center(child: CircularProgressIndicator(color: ColoresApp.primario)),
      },
    );
  }
}

class _Contenido extends StatelessWidget {
  const _Contenido({required this.usuario, required this.resumen, this.onIrInventario, this.onIrPadron});

  final Usuario usuario;
  final ResumenDashboard resumen;
  final VoidCallback? onIrInventario;
  final VoidCallback? onIrPadron;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        _Cabecera(usuario: usuario, nombreOlla: resumen.nombreOlla),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
            children: <Widget>[
              TarjetaKpiRaciones(
                entregadas: resumen.racionesEntregadas,
                meta: resumen.racionesPlanificadas,
              ),
              const SizedBox(height: 14),
              TarjetaInsumosPorVencer(insumos: resumen.insumosPorVencer),
              const SizedBox(height: 18),
              const Text(
                'Accesos rápidos',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: ColoresApp.textoSecundario),
              ),
              const SizedBox(height: 12),
              AccesosRapidos(onIrInventario: onIrInventario, onIrPadron: onIrPadron),
            ],
          ),
        ),
      ],
    );
  }
}

class _Cabecera extends StatelessWidget {
  const _Cabecera({required this.usuario, required this.nombreOlla});

  final Usuario usuario;
  final String nombreOlla;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[ColoresApp.verdeMedio, ColoresApp.verdeProfundo],
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 12, 22, 22),
          child: Row(
            children: <Widget>[
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  gradient: const LinearGradient(colors: <Color>[ColoresApp.primarioClaro, ColoresApp.primario]),
                ),
                alignment: Alignment.center,
                child: Text(
                  usuario.iniciales,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
                ),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'Hola, ${usuario.nombreCompleto.split(' ').first}',
                      style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      nombreOlla,
                      style: const TextStyle(color: ColoresApp.verdeClaro, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.notifications_none_rounded, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}
