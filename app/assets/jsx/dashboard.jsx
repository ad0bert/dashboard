/** @jsx React.DOM */

define(['react', 'jquery', 'moment'], function(React, $, Moment) {
  var LoadStatusMixin = {
    getInitialState: function() {
      return {
        lastCompletedBuild: { culprits: [], changesetItems: [] },
        buildCI: [],
      	buildNightly: [],
        nevergreens: [],
        users:[],
        audits:[],
        employeesAustria:""
      };
    },

    // load data from jenkins
    loadStatus: function() {
      $.ajax({
        url: '/buildCI',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
      
      $.ajax({
          url: '/buildNightly',
          dataType: 'json',
          success: function(data1) {
            this.setState(data1);
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
      
      $.ajax({
        url: '/getPhabUser',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
      
      $.ajax({
        url: '/getPhabAudits',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
      
      $.ajax({
        url: '/getUsers',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    },
    

    componentWillMount: function() {
      this.loadStatus();
      setInterval(this.loadStatus, this.props.pollInterval);
    },
  };

  var Dashboard = React.createClass({
    mixins: [LoadStatusMixin],

    getDefaultProps: function() {
      return {
        pollInterval: 5000
      };
    },

    render: function() {
      // ----------------------- helper -----------------------//
      function getAuditsForUser(user, audits){
        var res = 0;
        for (var i = 0; i < audits.length; i++){
          if (user.phid == audits[i].auditorPHID &&
              audits[i].status != "accepted"){
            res++;
          }
        }
        return res;
      }
      
      function getNotAssignedAudits(audits){
        var res = 0;
        for(var i = 0; i<audits.length; i++){
            if (audits[i].status === "audit-required"){
              res++;
          }
        }
        return res;
      }
      
      function mergeUserAudits(users, audits){
        var resultArray = new Array();
        for (var i = 0; i < users.length; i++){
          var cnt = getAuditsForUser(users[i], audits);
          if (cnt > 0){
            var userAudit = {
                userName : users[i].realName,
                numberOfAudits : cnt
            };
            resultArray.push(userAudit);
          }
        }
        
        var userAudit = {
            userName : "No Auditor",
            numberOfAudits : getNotAssignedAudits(audits)
        };
        resultArray.push(userAudit);
        
        return resultArray;
      }
      
      function UrlExists(url) {
        var http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();
        return http.status!=404;
      }
      
      function checkImage (src, good) {
        var img = new Image();
        img.onload = good; 
        img. src = src;
      }
      
      function getDefaultPicture(){
        return '/assets/images/avatars/default.jpg';
      }
      
      function formatEmplName(name){
        return name.replace(" ", ".").replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/Ä/g,"Ae").replace(/Ö/g,"Oe").replace(/Ü/g,"Ue").replace(/ß/g,"ss") + '.jpg';
      }
      
      var empl = this.state.employeesAustria;
      
      function getPicture(name){
        name = formatEmplName(name);
        
        if (empl.match(name.toLowerCase()) == null){
          return getDefaultPicture();
        }
        else{
            return 'http://austria/global/images/employees/' +  name;      
          }
        }
      
      function getCommitters(committer){
        var picture = getPicture(committer.fullName);

        var avatarUrlStyle = {
            background: 'url(' + picture + ')',
            backgroundSize: 'cover'
        };
        
        return (    
            <div className="avatar" 
                 style={avatarUrlStyle} 
                 key={committer.id} 
                 title={committer.id} >
            </div>
        );
      }
      
      function getStatusClassSet(build, name){
        var cx = React.addons.classSet;
        return cx({
          'status': name === 'status',
          'core': name === 'core',
          'workbench': name === 'workbench',
          'kdt': name === 'kdt',
          'stable': build.status === 'stable',
          'cancelled': build.status === 'cancelled',
          'unstable': build.status === 'unstable',
          'failed': build.status === 'failed',
          'pending': build.status === 'pending'
        });
      }
      
   // ----------------------- render functions -----------------------//

      function buildItems(build){
        var committerNodes = build.culprits.map(getCommitters);
        
        var classesStatus = getStatusClassSet(build, "status");
        var classesCoreResults = getStatusClassSet(build.core, 'core');        
        var classesWorkbenchResults = getStatusClassSet(build.workbench, 'workbench');
        var classesKDTResults = getStatusClassSet(build.kdt, 'kdt');
        
        var andOthers = ""; 
        if (committerNodes.length > 6){
          andOthers = "+ " + (committerNodes.length - 6) + " other(s)";
        }
        return (
            <li className="build-list-item">
              <div className="build-item">
                <ul>
                  <li className="build-number">
                    
                  </li>
                  <li className="avatars">
                    {committerNodes.slice(0,6)}
                    <div>{andOthers}</div>
                  </li>
                  <li className={classesStatus}>
                    <a href={build.link}>
                      {build.number}
                    </a>
                  </li>
                  <li>
                    <div>
                      <ul className="regression-list">
                        <li className={classesCoreResults}>
                          <a href={build.core.link}>
                            CORE
                          </a>
                        </li>
                        <li className={classesWorkbenchResults}>
                          <a href={build.workbench.link}>
                            WORKBENCH
                          </a>
                        </li>
                        <li className={classesKDTResults}>
                          <a href={build.kdt.link}>
                            KDT
                          </a>
                        </li>
                      </ul>
                    </div>
                  </li>
                </ul>
              </div>
            </li>
        );
      };
      
      function buildItemsNightly(build){
        var committerNodes = build.culprits.map(getCommitters);
        var classesStatus = getStatusClassSet(build, "status");
        var andOthers = ""; 
        if (committerNodes.length > 6){
          andOthers = "+ " + (committerNodes.length - 6) + " other(s)";
        }
        return (
            <li className="build-list-item">
              <div className="build-item">
                <ul>
                  <li className="build-number">
                    
                  </li>
                  <li className="avatars">
                    {committerNodes.slice(0,6)}
                    <div>{andOthers}</div>
                  </li>
                  <li className={classesStatus}>
                    <a href={build.link}>
                      {build.number}
                    </a>
                  </li>
                </ul>
              </div>
            </li>
        );
      };
    	
      function getNevergreens(nevergreen) {
        var linkText = nevergreen.definitionName;
        // cut off namespaces
        var nameArray = linkText.split(".");
        linkText = nameArray[nameArray.length-1];
        // fix in case of "... cases_None.opt\""," string
        if (linkText.length < 5){ 
          linkText = nevergreen.definitionName;
        }
        return (    		
      		<li key={nevergreen.id} className="nevergreen">
      		  <a href={nevergreen.link}>
      		    {nevergreen.nrOfFailures} &times; {linkText}
      		  </a>
      		</li>
      	);
      };
      
      function renderAudit(audit) {
        return (
          <div className="audits">
            <div className="audit-name"> 
              {audit.userName}
            </div>
            :
            <div className="audit-cnt"> 
              {audit.numberOfAudits}
            </div>
          </div>
        );
      }

   // ----------------------- generate html -----------------------//
      var buildItems = this.state.buildCI.map(buildItems);
      var buildNightly = this.state.buildNightly.map(buildItemsNightly);
      var nevergreenNodes = this.state.nevergreens.map(getNevergreens);
      var audits = mergeUserAudits(this.state.users, this.state.audits).sort(function(a, b){return b.numberOfAudits-a.numberOfAudits}).map(renderAudit);
      
   // ----------------------- html site structure -----------------------//
      return (
        <div>
          <article className="build-section">
            <section className="build-list">
            	<ul className="build-items">
                {buildItems}
            	</ul>
              <h1> Open Audits </h1>
              {audits.slice(0,13)}
            </section>
            <aside id="nevergreens" className="nevergreens">
              {buildNightly} 
              <h1> Nevergreens </h1>
              <ul className="nevergreen-list">
                {nevergreenNodes.slice(0,26)}
              </ul>
            </aside>
          </article> 
          <article className="device-container">
            <Devices pollInterval={5000}/>
          </article>
            <footer className="global-footer">
            <a href="/assets/DevicePusher/DevicePusher.UI.application" download="DevicePusher.UI.application">Download Device Pusher</a>
          </footer>
        </div>
        
      );
    }
  });

  
  var Devices = React.createClass({
    getInitialState: function() {
      return { devices: [],
        deviceIndex: -1 };
    },

    loadStatus: function() {
      $.ajax({
        url: '/getDevices/',
        dataType: 'json',
        success: function(data) {
          var newDeviceIndex = (this.state.deviceIndex + 1) % (data && data.length > 0 ? data.length : 1);
          this.setState({
            devices: data,
            deviceIndex: newDeviceIndex});
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(status, err.toString());
        }.bind(this)
      });
    },

    componentWillMount: function() {
      this.loadStatus();
      setInterval(this.loadStatus, this.props.pollInterval);
    },

    editDeviceLocation: function(deviceLocation) {
      var result = '';
      if (deviceLocation) {
        result = deviceLocation;
        var dashIndex = result.indexOf("-");
        if (dashIndex > -1) {
          result = result.substring(dashIndex + 1, result.length);
        }
        result = result.toLowerCase();
      }

      return result;
    },

    isOffscreen: function(elem$) {
      var offset = elem$.offset();
      return offset.top > $(window).height();
    },

    wrapAround: function(originalDevices, deviceIndex) {
      var result = originalDevices.slice(0);
      var len = $("tr.deviceLine").length;
      if (len > 0) {
        var lastElem$ = $("tr.deviceLine:last");
        if (this.isOffscreen(lastElem$)) {
          var first = result.splice(0, deviceIndex);
          for (var i = 0; i < first.length; i++) {
            result.push(first[i]);
          }
        }
      }
      return result;
    },

    render: function() {
      var that = this;
      var devices = this.wrapAround(this.state.devices, this.state.deviceIndex);
      var deviceNodes = devices.map(function(device) {
        var deviceLocation = that.editDeviceLocation(device.location);
        var classString = " deviceName " + device.osType;
        return (
            <tr className="deviceLine" key={device.id}>
            <td className={classString}>{device.name}</td>
              <td className="deviceLocation"><div>{deviceLocation}</div></td>
            </tr>
          );
      });

      return (
        <section>
          <header>
            <svg id="smartphone" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100">
              <g>
                <path d="M64.812,14.25H35.188c-4.418,0-8,3.582-8,8v55.5c0,4.418,3.582,8,8,8h29.625c4.418,0,8-3.582,8-8v-55.5   C72.812,17.831,69.23,14.25,64.812,14.25z M64.812,77.75H35.188v-55.5h29.625V77.75z"/>
                <circle cx="49.579" cy="70.85" r="4"/>
              </g>
            </svg>
            <h2>
              Device Rental
            </h2>
            <span>({devices.length} connected)</span>
          </header>
          <table className="device">
            {deviceNodes}
          </table>
        </section>
      );
    }
  });
  
  return Dashboard;
});
