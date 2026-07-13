import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/campo_codigo_otp.dart';
import '../../../../shared/widgets/modales/modal_error.dart';
import '../../domain/resultado_login.dart';
import '../controllers/controller_verificacion.dart';
import '../estado/estado_verificacion.dart';

/// Pantalla de verificación del código de 2 factores (TOTP), paso 2 de 2.
@RoutePage(name: 'VerificacionRoute')
class PaginaVerificacion extends ConsumerStatefulWidget {
  const PaginaVerificacion({super.key, required this.datosLogin});

  final ResultadoLogin datosLogin;

  @override
  ConsumerState<PaginaVerificacion> createState() => _PaginaVerificacionState();
}

class _PaginaVerificacionState extends ConsumerState<PaginaVerificacion> {
  String _codigo = '';

  bool get _requiereConfiguracion =>
      widget.datosLogin is ConfiguracionTotpRequerida;

  void _verificar() {
    if (_codigo.length != CampoCodigoOtp.cantidadDigitos) return;
    ref
        .read(controllerVerificacionProvider.notifier)
        .verificarCodigo(
          email: widget.datosLogin.email,
          tempToken: widget.datosLogin.tempToken,
          codigo: _codigo,
        );
  }

  /// El `tempToken` del login caduca a los pocos minutos. Cuando eso pasa,
  /// reintentar aquí siempre vuelve a fallar: hay que rehacer el login.
  bool _tokenExpirado(String mensaje) =>
      mensaje.toLowerCase().contains('token temporal');

  Future<void> _reaccionarEstado(EstadoVerificacion estado) async {
    if (estado is VerificacionExito) {
      await context.router.replaceAll(<PageRouteInfo>[const HomeRoute()]);
    } else if (estado is VerificacionError) {
      ref.read(controllerVerificacionProvider.notifier).reiniciar();
      if (_tokenExpirado(estado.mensaje)) {
        await ModalError.mostrar(
          context,
          titulo: 'Sesión expirada',
          mensaje:
              'Tu sesión de verificación caducó. Inicia sesión de nuevo para pedir un código nuevo.',
          textoReintentar: 'Volver a iniciar sesión',
        );
        if (!mounted) return;
        await context.router.replaceAll(<PageRouteInfo>[const LoginRoute()]);
        return;
      }
      await ModalError.mostrar(context, mensaje: estado.mensaje);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<EstadoVerificacion>(
      controllerVerificacionProvider,
      (_, EstadoVerificacion estado) => _reaccionarEstado(estado),
    );
    final bool cargando =
        ref.watch(controllerVerificacionProvider) is VerificacionCargando;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(28, 12, 28, 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _BotonAtras(),
              const SizedBox(height: 18),
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: ColoresApp.primarioSuave,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Icon(
                  Icons.verified_user_outlined,
                  color: ColoresApp.primario,
                  size: 32,
                ),
              ),
              const SizedBox(height: 22),
              Text(
                'Verificación',
                style: Theme.of(context).textTheme.displayMedium,
              ),
              const SizedBox(height: 8),
              Text(
                _subtitulo(),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: ColoresApp.textoTerciario,
                  height: 1.5,
                ),
              ),
              if (_requiereConfiguracion) ...<Widget>[
                const SizedBox(height: 16),
                _BloqueConfiguracionTotp(
                  secret:
                      (widget.datosLogin as ConfiguracionTotpRequerida).secret,
                ),
              ],
              const SizedBox(height: 30),
              CampoCodigoOtp(
                habilitado: !cargando,
                onCambio: (String v) => _codigo = v,
                onCompletado: (_) => _verificar(),
              ),
              const SizedBox(height: 22),
              const Center(
                child: Text(
                  'Abre tu app autenticadora para ver el código',
                  style: TextStyle(
                    color: ColoresApp.textoTerciario,
                    fontSize: 13.5,
                  ),
                ),
              ),
              const Spacer(),
              FilledButton(
                onPressed: cargando ? null : _verificar,
                child: cargando
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.4,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Verificar'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _subtitulo() {
    final String correo = _enmascararCorreo(widget.datosLogin.email);
    if (_requiereConfiguracion) {
      return 'Configura tu app autenticadora con la clave de abajo y luego ingresa el código de 6 dígitos para $correo.';
    }
    return 'Ingresa el código de 6 dígitos de tu app autenticadora para $correo.';
  }

  String _enmascararCorreo(String correo) {
    final int arroba = correo.indexOf('@');
    if (arroba <= 2) return correo;
    return '${correo.substring(0, 2)}•••${correo.substring(arroba)}';
  }
}

class _BotonAtras extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Material(
      color: ColoresApp.superficie,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () => context.router.maybePop(),
        child: const SizedBox(
          width: 42,
          height: 42,
          child: Icon(
            Icons.chevron_left_rounded,
            color: ColoresApp.textoPrincipal,
          ),
        ),
      ),
    );
  }
}

class _BloqueConfiguracionTotp extends StatelessWidget {
  const _BloqueConfiguracionTotp({required this.secret});

  final String secret;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ColoresApp.primarioSuave,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF3E2D2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Clave para tu app autenticadora',
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: ColoresApp.bajoTexto,
            ),
          ),
          const SizedBox(height: 6),
          SelectableText(
            secret,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: ColoresApp.textoPrincipal,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}
