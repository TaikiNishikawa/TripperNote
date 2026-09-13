import UIKit
import Capacitor

@objc(TripperBridgeViewController)
open class TripperBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(PlaceResolverPlugin())
    }
}
