import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../config/router/app_router.dart';
import '../../../core/sesion/almacen_sesion.dart';
import '../../../core/tema/colores_app.dart';
import '../../../shared/widgets/modales/modal_confirmacion.dart';
import '../../auth/domain/entidades/usuario.dart';
import 'controller_perfil.dart';

/// Pestaña "Más": perfil, accesos a otras pantallas y cierre de sesión.
class PaginaMas extends ConsumerWidget {
  const PaginaMas({super.key});

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
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Usuario?> usuario = ref.watch(usuarioActualProvider);
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: <Widget>[
            Text('Más opciones', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 16),
            _TarjetaPerfil(usuario: usuario.valueOrNull),
            const SizedBox(height: 12),
            _Grupo(
              items: <Widget>[
                _Opcion(icono: Icons.calculate_outlined, etiqueta: 'Calculadora de preparación', onTap: () => context.router.push(const CalculadoraRoute())),
                _Opcion(icono: Icons.restaurant_menu_rounded, etiqueta: 'Sugerencias de menú', onTap: () => context.router.push(const MenuIaRoute())),
                _Opcion(icono: Icons.notifications_none_rounded, etiqueta: 'Alertas', onTap: () => context.router.push(const AlertasRoute())),
                _Opcion(icono: Icons.photo_camera_outlined, etiqueta: 'Subir evidencia', onTap: () => context.router.push(const EvidenciasRoute()), conBorde: false),
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
              gradient: const LinearGradient(colors: <Color>[ColoresApp.primarioClaro, ColoresApp.primario]),
            ),
            alignment: Alignment.center,
            child: Text(usuario?.iniciales ?? '··', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(usuario?.nombreCompleto ?? 'Cargando...', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: ColoresApp.textoPrincipal)),
                const SizedBox(height: 2),
                Text(usuario?.nombreTenant ?? '', style: const TextStyle(fontSize: 13, color: ColoresApp.textoTenue)),
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
  const _Opcion({required this.icono, required this.etiqueta, required this.onTap, this.conBorde = true});

  final IconData icono;
  final String etiqueta;
  final VoidCallback onTap;
  final bool conBorde;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(border: conBorde ? const Border(bottom: BorderSide(color: Color(0xFFF2EEE6))) : null),
        child: Row(
          children: <Widget>[
            Icon(icono, color: ColoresApp.verdeMedio, size: 22),
            const SizedBox(width: 14),
            Expanded(child: Text(etiqueta, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: ColoresApp.textoPrincipal))),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFFC3BBAE)),
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
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFF1D9D4))),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Icon(Icons.logout_rounded, color: ColoresApp.criticoPunto, size: 20),
              SizedBox(width: 10),
              Text('Cerrar sesión', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: ColoresApp.criticoPunto)),
            ],
          ),
        ),
      ),
    );
  }
}
