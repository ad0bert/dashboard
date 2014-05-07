package controllers

import play.api._
import play.api.mvc._
import play.api.libs.ws.WS
import scala.concurrent.ExecutionContext
import ExecutionContext.Implicits.global
import java.net.URI
import play.api.libs.json.Json
import play.api.libs.json._
import play.api.data._
import play.api.data.Forms._
import models.MobileDevice
import models.Location

object Application extends Controller {
  
    var devices = Map(
      ("Apple iPod", "82B776F8950C9F0738D32CB91F670E70DAF8C796") -> "none",
      ("GT-I9300", "7&10457552&0&0000") -> "none",
      ("Nexus 10", "6&435B021&0&0000") -> "none")

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  def fetchJson(url: String) = Action.async {
    val uri = URI.create(url)
    WS.url(uri.toString).get.map(response => Ok(response.json))
  }
  
  def setDevice() = Action { implicit request =>
	val userForm = Form(
	    tuple(
	    "device" -> text,
	    "system" -> text,
	    "id" -> text
	    )
	)
    val (deviceName, system, deviceId) = userForm.bindFromRequest.get;
    Logger.info(s"Device is: $deviceName $system $deviceId");
    MobileDevice.byDeviceId(deviceId) match {
      case Some(device) => {
        val location = Location.findOrCreate(system)
        MobileDevice.setLocation(device, location.id)
        Ok(deviceId)
      }
      case None => {
        Logger.info(s"unkown device '$deviceId'")
        NotFound(deviceId)
      }
    }
  }

  def getDevices() = Action {
    implicit val jsonWrites = MobileDevice.jsonWrites
    //val devicesAndLocations = MobileDevice.all.map(device => (device, Location.all.find(_.id == device.locationId)))
    Ok(Json.toJson(MobileDevice.all))
  }

}