package uz.dehqonjon.app

import com.getcapacitor.BridgeActivity
import uz.dehqonjon.app.plugins.AiPlugin
import uz.dehqonjon.app.plugins.DatabasePlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        // Register custom plugins before super.onCreate()
        registerPlugin(AiPlugin::class.java)
        registerPlugin(DatabasePlugin::class.java)
        
        super.onCreate(savedInstanceState)
    }
}
