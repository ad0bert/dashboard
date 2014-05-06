/** @jsx React.DOM */

var Dashboard = React.createClass({
  render: function() {
    return (
        <div>
          <article>
          <BuildStatus
            buildName="CI Build Status"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest%20CI" 
            pollInterval={2000}/>
          </article>
          <article>
          <BuildStatus
            buildName="Nightly Build Status"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest" 
            pollInterval={2000}/>
          </article>
        </div>
        );
  }
  
});

var BuildStatus = React.createClass({
  getInitialState: function() {
    return {};
  },

  loadStatus: function() {
    $.ajax({
      url: '/fetchJson/'+ encodeURIComponent(this.props.url + "/api/json"),
      dataType: 'json',
      success: function(data) {
    	var newState = {
              lastCompletedBuild: data.lastCompletedBuild.number,
              lastSuccessfulBuild: data.lastSuccessfulBuild.number,
              lastStableBuild: data.lastStableBuild.number,
              culprits: this.state.culprits
            };
	    var isStable = newState.lastStableBuild === newState.lastCompletedBuild;
	    var isSuccessful = newState.lastSuccessfulBuild === newState.lastCompletedBuild;

    	if(!isStable || !isSuccessful) {
		    $.ajax({
		        url: '/fetchJson/'+ encodeURIComponent(this.props.url + "/" + data.lastCompletedBuild.number + "/api/json?tree=culprits[fullName]" ),
		        dataType: 'json',
		        success: function(data) {
		          this.setState({ 
		        	culprits: data.culprits,
		            lastCompletedBuild: this.state.lastCompletedBuild,
		            lastSuccessfulBuild: this.state.lastSuccessfulBuild,
		            lastStableBuild: this.state.lastStableBuild
		          })
		        }.bind(this),
		        error: function(xhr, status, err) {
		          console.error(this.props.url, status, err.toString());
		        }.bind(this)
		      });
    	}
    	  
        this.setState(newState);
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
  
  render: function() {
    var isStable = this.state.lastStableBuild === this.state.lastCompletedBuild;
    var isSuccessful = !isStable && this.state.lastSuccessfulBuild === this.state.lastCompletedBuild;
    var cx = React.addons.classSet;
    var classes = cx({
      'build-status' : true,
      'stable': isStable,
      'successful': isSuccessful,
      'failed': !isStable && !isSuccessful
    });
    var authorNodes = []
    if(this.state.culprits) {
    	var culprits = this.state.culprits;
    	authorNodes = culprits.map(function(item) {
    	return(
    		<div>{item.fullName}</div>
    	);
    });
    }
    
    return (
      <section>
        <div className={classes} id="status">
          {isStable ? 'stable.' : (isSuccessful ? 'unstable.' : 'failed.')}
        </div>
        <div className="label">
          {this.props.buildName}
        </div>
        <div className="contributes" >
          {authorNodes}
        </div>
      </section>
    );
  }
});

React.renderComponent(
    <Dashboard />,
    document.getElementById('content')
  );