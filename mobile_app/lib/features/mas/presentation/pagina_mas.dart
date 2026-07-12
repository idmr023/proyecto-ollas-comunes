import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../config/router/app_router.dart';
import '../../../core/offline/almacen_offline.dart';
import '../../../core/red/cliente_http.dart';
import '../../../core/sesion/almacen_sesion.dart';
import '../../../core/tema/colores_app.dart';
import '../../../shared/widgets/modales/modal_confirmacion.dart';
import '../../../shared/widgets/modales/modal_error.dart';
import '../../../shared/widgets/modales/modal_exito.dart';
import '../../auth/domain/entidades/usuario.dart';
import 'controller_perfil.dart';

/// Pestaña "Más": perfil, accesos a otras pantallas y cierre de sesión.
class PaginaMas extends ConsumerStatefulWidget {
  const PaginaMas({super.key});

  @override
  ConsumerState<PaginaMas> createState() => _PaginaMasState();
}

class _PaginaMasState extends ConsumerState<PaginaMas> {
  int _pendientes = 0;
  bool _sincronizando = false;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(_cargarPendientes);
  }

  Future<void> _cargarPendientes() async {
    final int total = await sl<AlmacenOffline>().contarMutaciones();
    if (!mounted) return;
    setState(() => _pendientes = total);
  }

  Future<void> _sincronizarPendientes(BuildContext context) async {
    if (_sincronizando) return;
    setState(() => _sincronizando = true);
    try {
      await _cargarPendientes();
      final int sincronizadas = await sl<ClienteHttp>().sincronizarPendientes();
      await _cargarPendientes();
      if (!context.mounted) return;
      await ModalExito.mostrar(
        context,
        mensaje: sincronizadas == 0
            ? 'No habia acciones pendientes para sincronizar.'
            : 'Se sincronizaron $sincronizadas accion(es) pendiente(s).',
      );
    } catch (_) {
      if (!context.mounted) return;
      await ModalError.mostrar(
        context,
        mensaje:
            'No se pudo sincronizar ahora. Intenta nuevamente cuando tengas conexion.',
      );
    } finally {
      if (mounted) setState(() => _sincronizando = false);
    }
  }

  Future<void> _cerrarSesion(BuildContext context, WidgetRef ref) async {
    final bool confirmado = await ModalConfirmacion.mostrar(
      context,
      titulo: '¿Cerrar sesión?',
      mensaje: 'Tendrás que ingresar de nuevo con tu correo y código.',
      textoConfirmar: 'Cerrar sesión',
    );
    if (!confirmado || !context.mounted) return;
    await sl<AlmacenSesion>().cerrarSesion();
    if (!context.mounted) return;
    await context.router.replaceAll(<PageRouteInfo>[const LoginRoute()]);
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Usuario?> usuario = ref.watch(usuarioActualProvider);
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: <Widget>[
            Text(
              'Más opciones',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),
            _TarjetaPerfil(usuario: usuario.valueOrNull),
            const SizedBox(height: 12),
            _TarjetaSincronizacion(
              pendientes: _pendientes,
              sincronizando: _sincronizando,
            ),
            const SizedBox(height: 12),
            _Grupo(
              items: <Widget>[
                _Opcion(
                  icono: Icons.calculate_outlined,
                  etiqueta: 'Calculadora de preparación',
                  onTap: () => context.router.push(const CalculadoraRoute()),
                ),
                _Opcion(
                  icono: Icons.restaurant_menu_rounded,
                  etiqueta: 'Sugerencias de menú',
                  onTap: () => context.router.push(const MenuIaRoute()),
                ),
                _Opcion(
                  icono: Icons.notifications_none_rounded,
                  etiqueta: 'Alertas',
                  onTap: () => context.router.push(const AlertasRoute()),
                ),
                _Opcion(
                  icono: Icons.photo_camera_outlined,
                  etiqueta: 'Subir evidencia',
                  onTap: () => context.router.push(const EvidenciasRoute()),
                  conBorde: false,
                ),
              ],
            ),
            const SizedBox(height: 12),
            _Grupo(
              items: <Widget>[
                _Opcion(
                  icono: Icons.sync_rounded,
                  etiqueta: _sincronizando
                      ? 'Sincronizando...'
                      : _pendientes == 0
                      ? 'Revisar sincronizacion'
                      : 'Sincronizar pendientes ($_pendientes)',
                  onTap: _sincronizando
                      ? null
                      : () => _sincronizarPendientes(context),
                  conBorde: false,
                ),
              ],
            ),
            const SizedBox(height: 12),
            _BotonCerrarSesion(onTap: () => _cerrarSesion(context, ref)),
          ],
        ),
      ),
    );
  }
}

class _TarjetaPerfil extends StatelessWidget {
  const _TarjetaPerfil({required this.usuario});

  final Usuario? usuario;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              gradient: const LinearGradient(
                colors: <Color>[ColoresApp.primarioClaro, ColoresApp.primario],
              ),
            ),
            alignment: Alignment.center,
            child: Text(
              usuario?.iniciales ?? '··',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 18,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  usuario?.nombreCompleto ?? 'Cargando...',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: ColoresApp.textoPrincipal,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  usuario?.nombreTenant ?? '',
                  style: const TextStyle(
                    fontSize: 13,
                    color: ColoresApp.textoTenue,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TarjetaSincronizacion extends StatelessWidget {
  const _TarjetaSincronizacion({
    required this.pendientes,
    required this.sincronizando,
  });

  final int pendientes;
  final bool sincronizando;

  @override
  Widget build(BuildContext context) {
    final bool alDia = pendientes == 0 && !sincronizando;
    final Color color = alDia ? ColoresApp.okPunto : ColoresApp.primario;
    final IconData icono = alDia
        ? Icons.cloud_done_outlined
        : Icons.cloud_sync_outlined;
    final String titulo = sincronizando
        ? 'Sincronizando datos'
        : alDia
        ? 'Datos sincronizados'
        : '$pendientes accion(es) pendiente(s)';
    final String mensaje = alDia
        ? 'Puedes trabajar con normalidad. Si pierdes conexion, guardaremos tus acciones criticas.'
        : 'Las acciones sin red se guardan en el equipo y se enviaran cuando vuelva la conexion.';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icono, color: color),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  titulo,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: ColoresApp.textoPrincipal,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  mensaje,
                  style: const TextStyle(
                    fontSize: 12.5,
                    height: 1.3,
                    color: ColoresApp.textoTenue,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Grupo extends StatelessWidget {
  const _Grupo({required this.items});

  final List<Widget> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: ColoresApp.borde),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: items),
    );
  }
}

class _Opcion extends StatelessWidget {
  const _Opcion({
    required this.icono,
    required this.etiqueta,
    required this.onTap,
    this.conBorde = true,
  });

  final IconData icono;
  final String etiqueta;
  final VoidCallback? onTap;
  final bool conBorde;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: conBorde
              ? const Border(bottom: BorderSide(color: Color(0xFFF2EEE6)))
              : null,
        ),
        child: Row(
          children: <Widget>[
            Icon(
              icono,
              color: onTap == null
                  ? ColoresApp.textoPlaceholder
                  : ColoresApp.verdeMedio,
              size: 22,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                etiqueta,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: onTap == null
                      ? ColoresApp.textoTenue
                      : ColoresApp.textoPrincipal,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: onTap == null
                  ? ColoresApp.bordeFuerte
                  : const Color(0xFFC3BBAE),
            ),
          ],
        ),
      ),
    );
  }
}

class _BotonCerrarSesion extends StatelessWidget {
  const _BotonCerrarSesion({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: ColoresApp.superficie,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFF1D9D4)),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Icon(
                Icons.logout_rounded,
                color: ColoresApp.criticoPunto,
                size: 20,
              ),
              SizedBox(width: 10),
              Text(
                'Cerrar sesión',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: ColoresApp.criticoPunto,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
