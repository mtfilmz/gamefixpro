package pr.supermobile.compartir

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.net.Uri
import android.provider.Telephony
import androidx.core.content.FileProvider
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.File

@InvokeArg
class ShareFileArgs {
    lateinit var path: String
    var mimeType: String = "image/jpeg"
    var title: String? = null
    var text: String? = null
}

@InvokeArg
class DirectArgs {
    lateinit var path: String
    lateinit var phone: String
    var text: String? = null
    var app: String? = null
}

@TauriPlugin
class SharePlugin(private val activity: Activity) : Plugin(activity) {

    private fun uriFor(path: String): Uri? {
        val file = File(path)
        if (!file.exists()) return null
        return FileProvider.getUriForFile(activity, activity.packageName + ".compartir.fileprovider", file)
    }

    @Suppress("DEPRECATION")
    private fun installed(pkg: String): Boolean {
        return try {
            activity.packageManager.getPackageInfo(pkg, 0)
            true
        } catch (e: Exception) {
            false
        }
    }

    @Command
    fun shareFile(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(ShareFileArgs::class.java)
            val uri = uriFor(args.path)
            if (uri == null) {
                invoke.reject("No se encontró el archivo para compartir.")
                return
            }
            val send = Intent(Intent.ACTION_SEND).apply {
                type = args.mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                args.text?.let { putExtra(Intent.EXTRA_TEXT, it) }
                clipData = ClipData.newRawUri("", uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            val chooser = Intent.createChooser(send, args.title ?: "Compartir")
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            activity.startActivity(chooser)
            invoke.resolve()
        } catch (e: Exception) {
            invoke.reject("No se pudo compartir: " + (e.message ?: e.toString()))
        }
    }

    @Command
    fun whatsappApps(invoke: Invoke) {
        val ret = JSObject()
        ret.put("whatsapp", installed("com.whatsapp"))
        ret.put("business", installed("com.whatsapp.w4b"))
        invoke.resolve(ret)
    }

    /** Abre el chat de WhatsApp del número (solo dígitos con código de país) con la imagen adjunta. */
    @Command
    fun shareWhatsApp(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(DirectArgs::class.java)
            val uri = uriFor(args.path)
            if (uri == null) {
                invoke.reject("No se encontró la imagen de la factura.")
                return
            }
            val order = if (args.app == "business") listOf("com.whatsapp.w4b", "com.whatsapp") else listOf("com.whatsapp", "com.whatsapp.w4b")
            val pkg = order.firstOrNull { installed(it) }
            if (pkg == null) {
                invoke.reject("WhatsApp no está instalado en este teléfono.")
                return
            }
            val digits = args.phone.filter { it.isDigit() }
            val send = Intent(Intent.ACTION_SEND).apply {
                type = "image/jpeg"
                setPackage(pkg)
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra("jid", "$digits@s.whatsapp.net")
                args.text?.let { putExtra(Intent.EXTRA_TEXT, it) }
                clipData = ClipData.newRawUri("", uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            activity.startActivity(send)
            invoke.resolve()
        } catch (e: ActivityNotFoundException) {
            invoke.reject("WhatsApp no está instalado en este teléfono.")
        } catch (e: Exception) {
            invoke.reject("No se pudo abrir WhatsApp: " + (e.message ?: e.toString()))
        }
    }

    /** Abre la app de Mensajes (la que use el teléfono) con el número y la imagen adjunta. */
    @Command
    fun shareSms(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(DirectArgs::class.java)
            val uri = uriFor(args.path)
            if (uri == null) {
                invoke.reject("No se encontró la imagen de la factura.")
                return
            }
            val smsApp = Telephony.Sms.getDefaultSmsPackage(activity)
            val send = Intent(Intent.ACTION_SEND).apply {
                type = "image/jpeg"
                if (smsApp != null) setPackage(smsApp)
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra("address", args.phone)
                putExtra("sms_body", args.text ?: "")
                clipData = ClipData.newRawUri("", uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            try {
                activity.startActivity(send)
            } catch (e: ActivityNotFoundException) {
                // Sin app de mensajes que acepte imágenes: abrir el mensaje al número (sin imagen).
                val plain = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:" + args.phone)).apply {
                    putExtra("sms_body", args.text ?: "")
                }
                activity.startActivity(plain)
            }
            invoke.resolve()
        } catch (e: Exception) {
            invoke.reject("No se pudo abrir Mensajes: " + (e.message ?: e.toString()))
        }
    }
}
