import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/logo_olla.dart';
import '../../../../shared/widgets/modales/modal_error.dart';
import '../controllers/controller_login.dart';
import '../estado/estado_login.dart';

/// Pantalla de inicio de sesión: correo y contraseña (paso 1 de 2).
@RoutePage(name: 'LoginRoute')
class PaginaLogin extends ConsumerStatefulWidget {
  const PaginaLogin({super.key});

  @override
  ConsumerState<PaginaLogin> createState() => _PaginaLoginState();
}

class _PaginaLoginState extends ConsumerState<PaginaLogin> {
  final TextEditingController _correo = TextEditingController();
  final TextEditingController _password = TextEditingController();
  final GlobalKey<FormState> _formulario = GlobalKey<FormState>();
  bool _ocultarPassword = true;

  @override
  void dispose() {
    _correo.dispose();
    _password.dispose();
    super.dispose();
  }

  void _enviar() {
    if (!_formulario.currentState!.validate()) return;
    ref.read(controllerLoginProvider.notifier).iniciarSesion(
          email: _correo.text,
          password: _password.text,
        );
  }

  Future<void> _reaccionarEstado(EstadoLogin estado) async {
    if (estado is LoginExito) {
      await context.router.push(VerificacionRoute(datosLogin: estado.resultado));
      ref.read(controllerLoginProvider.notifier).reiniciar();
    } else if (estado is LoginError) {
      ref.read(controllerLoginProvider.notifier).reiniciar();
      final bool reintentar = await ModalError.mostrar(context, mensaje: estado.mensaje);
      if (reintentar) _enviar();
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<EstadoLogin>(controllerLoginProvider, (_, EstadoLogin estado) => _reaccionarEstado(estado));
    final bool cargando = ref.watch(controllerLoginProvider) is LoginCargando;
    return Scaffold(
      body: Column(
        children: <Widget>[
          _Cabecera(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(26, 28, 26, 26),
              child: Form(
                key: _formulario,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    _Etiqueta('Correo'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _correo,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(hintText: 'correo@ejemplo.pe'),
                      validator: _validarCorreo,
                    ),
                    const SizedBox(height: 18),
                    _Etiqueta('Contraseña'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _password,
                      obscureText: _ocultarPassword,
                      decoration: InputDecoration(
                        hintText: '••••••••',
                        suffixIcon: IconButton(
                          icon: Icon(
                            _ocultarPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                            color: ColoresApp.textoPlaceholder,
                          ),
                          onPressed: () => setState(() => _ocultarPassword = !_ocultarPassword),
                        ),
                      ),
                      validator: (String? v) => (v == null || v.isEmpty) ? 'Ingresa tu contraseña.' : null,
                    ),
                    const SizedBox(height: 14),
                    const Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        '¿Olvidaste tu contraseña?',
                        style: TextStyle(color: ColoresApp.primario, fontWeight: FontWeight.w600, fontSize: 13.5),
                      ),
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: cargando ? null : _enviar,
                      child: cargando
                          ? const SizedBox(
                              width: 22, height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                            )
                          : const Text('Ingresar'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String? _validarCorreo(String? valor) {
    if (valor == null || valor.trim().isEmpty) return 'Ingresa tu correo.';
    final bool valido = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(valor.trim());
    return valido ? null : 'Correo no válido.';
  }
}

class _Cabecera extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 230,
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[ColoresApp.verdeMedio, ColoresApp.verdeProfundo],
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(34)),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(28, 0, 28, 26),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const LogoOlla(tamano: 62, radio: 18),
              const SizedBox(height: 16),
              Text('Bienvenida', style: Theme.of(context).textTheme.displayMedium?.copyWith(color: Colors.white)),
              const SizedBox(height: 4),
              const Text(
                'Ingresa para gestionar tu olla común',
                style: TextStyle(color: ColoresApp.verdeClaro, fontSize: 14.5, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Etiqueta extends StatelessWidget {
  const _Etiqueta(this.texto);

  final String texto;

  @override
  Widget build(BuildContext context) {
    return Text(
      texto,
      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: ColoresApp.textoSecundario),
    );
  }
}
