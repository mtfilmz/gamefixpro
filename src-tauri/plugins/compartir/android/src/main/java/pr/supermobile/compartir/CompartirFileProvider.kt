package pr.supermobile.compartir

import androidx.core.content.FileProvider

/** Proveedor propio para no chocar con otros FileProvider de la app. */
class CompartirFileProvider : FileProvider()
