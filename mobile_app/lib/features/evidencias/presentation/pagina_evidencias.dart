import 'dart:convert';
import 'dart:typed_data';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/tema/colores_app.dart';
import '../../../shared/widgets/modales/modal_error.dart';
import '../../../shared/widgets/modales/modal_exito.dart';
import '../domain/repositorio_evidencias.dart';
import 'controller_evidencia.dart';
import 'estado_evidencia.dart';

/// Pantalla para capturar o seleccionar una evidencia (foto) y subirla.
@RoutePage(name: 'EvidenciasRoute')
class PaginaEvidencias extends ConsumerStatefulWidget {
  const PaginaEvidencias({super.key});

  @override
  ConsumerState<PaginaEvidencias> createState() => _PaginaEvidenciasState();
}

class _PaginaEvidenciasState extends ConsumerState<PaginaEvidencias> {
  final ImagePicker _selector = ImagePicker();
  final TextEditingController _titulo = TextEditingController();
  Uint8List? _bytes;
  String _nombreArchivo = '';

  @override
  void dispose() {
    _titulo.dispose();
    super.dispose();
  }

  Future<void> _elegirImagen(ImageSource origen) async {
    final XFile? archivo = await _selector.pickImage(
      source: origen,
      imageQuality: 70,
      maxWidth: 1600,
    );
    if (archivo == null) return;
    final Uint8List bytes = await archivo.readAsBytes();
    setState(() {
      _bytes = bytes;
      _nombreArchivo = archivo.name;
    });
  }

  void _subir() {
    if (_bytes == null) {
      ModalError.mostrar(
        context,
        titulo: 'Falta la foto',
        mensaje: 'Captura o selecciona una imagen primero.',
      );
      return;
    }
    if (_titulo.text.trim().isEmpty) {
      ModalError.mostrar(
        context,
        titulo: 'Falta el título',
        mensaje: 'Escribe un título para la evidencia.',
      );
      return;
    }
    ref
        .read(controllerEvidenciaProvider.notifier)
        .subir(
          DatosEvidencia(
            nombreArchivo: _nombreArchivo.isEmpty
                ? 'evidencia.jpg'
                : _nombreArchivo,
            tipoArchivo: 'image/jpeg',
            titulo: _titulo.text.trim(),
            base64: base64Encode(_bytes!),
          ),
        );
  }

  Future<void> _reaccionar(EstadoEvidencia estado) async {
    if (estado is EvidenciaExito) {
      ref.read(controllerEvidenciaProvider.notifier).reiniciar();
      await ModalExito.mostrar(
        context,
        mensaje: 'La evidencia se subió correctamente.',
      );
      if (!mounted) return;
      context.router.maybePop();
    } else if (estado is EvidenciaError) {
      ref.read(controllerEvidenciaProvider.notifier).reiniciar();
      await ModalError.mostrar(context, mensaje: estado.mensaje);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<EstadoEvidencia>(
      controllerEvidenciaProvider,
      (_, EstadoEvidencia e) => _reaccionar(e),
    );
    final bool subiendo =
        ref.watch(controllerEvidenciaProvider) is EvidenciaSubiendo;
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
          'Nueva evidencia',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: ColoresApp.textoPrincipal,
          ),
        ),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: <Widget>[
          _AreaImagen(bytes: _bytes),
          const SizedBox(height: 14),
          Row(
            children: <Widget>[
              Expanded(
                child: _BotonOrigen(
                  icono: Icons.photo_camera_outlined,
                  etiqueta: 'Cámara',
                  onTap: () => _elegirImagen(ImageSource.camera),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _BotonOrigen(
                  icono: Icons.photo_library_outlined,
                  etiqueta: 'Galería',
                  onTap: () => _elegirImagen(ImageSource.gallery),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'Título',
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w700,
              color: ColoresApp.textoSecundario,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _titulo,
            decoration: const InputDecoration(
              hintText: 'Ej. Acta de entrega, foto del almuerzo...',
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          child: FilledButton(
            onPressed: subiendo ? null : _subir,
            child: subiendo
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: Colors.white,
                    ),
                  )
                : const Text('Subir evidencia'),
          ),
        ),
      ),
    );
  }
}

class _AreaImagen extends StatelessWidget {
  const _AreaImagen({required this.bytes});

  final Uint8List? bytes;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 220,
      decoration: BoxDecoration(
        color: ColoresApp.superficieAlterna,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: ColoresApp.borde),
      ),
      clipBehavior: Clip.antiAlias,
      child: bytes == null
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Icon(
                    Icons.image_outlined,
                    size: 48,
                    color: ColoresApp.textoPlaceholder,
                  ),
                  SizedBox(height: 10),
                  Text(
                    'Aún no hay imagen',
                    style: TextStyle(color: ColoresApp.textoTenue),
                  ),
                ],
              ),
            )
          : Image.memory(bytes!, fit: BoxFit.cover, width: double.infinity),
    );
  }
}

class _BotonOrigen extends StatelessWidget {
  const _BotonOrigen({
    required this.icono,
    required this.etiqueta,
    required this.onTap,
  });

  final IconData icono;
  final String etiqueta;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: ColoresApp.superficie,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: ColoresApp.bordeFuerte),
          ),
          child: Column(
            children: <Widget>[
              Icon(icono, color: ColoresApp.verdeMedio, size: 26),
              const SizedBox(height: 8),
              Text(
                etiqueta,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: ColoresApp.textoSecundario,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
