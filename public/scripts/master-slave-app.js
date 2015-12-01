'use strict';

var socket = io( 'ws://localhost:3401' );

var SlaveTabs = React.createClass( {
	'_handleClick' : function ( e ) {
		this.props.onSwitchTab( e.currentTarget.dataset.index, this.props.slaves[ e.currentTarget.dataset.index ] );
	},

	'render' : function () {
		return (
			<div className="navbar">
				<ul className="nav nav-tabs">
					{
						this.props.slaves.map( function ( slave, key ) {
							return (
								<li key={ key } role="presentation" className={ slave.activeTab ? 'active' : '' }>
									<a href="#" data-index={ key } onClick={ this._handleClick }>
										{ slave.platform }-{ slave.id }
									</a>
								</li>
							);
						}.bind( this ) )
					}
				</ul>
			</div>
		);
	}

} );

var SlaveContainer = React.createClass( {

	'_handleClick' : function () {
		$.get( 'http://localhost:3400/vms/' + this.props.slave.platform + '/' + this.props.slave.id, function () {
			console.log( 'sucess' );
		} );
	},

	'render' : function () {
		return (
			<div className="col-xs-12">
				<h3>{ this.props.slave.platform }-{ this.props.slave.id }</h3>
				<button type="button" className="btn btn-primary" onClick={ this._handleClick }>Run</button>
				<button type="button" className="btn btn-danger">Cancel</button>
			</div>
		);
	}

} );

var StdoutContainer = React.createClass( {

	'render' : function () {
		return (
			<div className="stdout col-xs-12">
				{
					this.props.slave.stdout.map( function ( stdout, key ) {
						return (
							<p key={ key }>{ stdout }</p>
						);
					} )
				}
			</div>
		);
	}

} );

var MasterSlaveApp = React.createClass( {

	'getInitialState' : function () {
		return {
			'slaves'      : [ ],
			'activeSlave' : {
				'id'        : '',
				'platform'  : '',
				'activeTab' : false,
				'stdout'    : [ ]
			}
		};
	},

	'componentDidMount' : function () {
		socket.on( 'connect', this._initialize );
		socket.on( 'data-stream', this._streamData );
		socket.on( 'disconnect', this._disconnect );
		socket.on( 'update-slaves-list', this._updateSlaveList );
	},

	'_initialize' : function () {
		socket.emit( 'update-slaves-list', function ( data ) {
			console.log( data );
		} );
	},

	'_streamData' : function ( res ) {
		this.state.slaves.filter( function ( slave ) {
			if ( slave.platform === res.platform && slave.id === res.machine ) {
				slave.stdout.push( res.data[ 2 ] );
			}
		} );

		this.setState( { 'slaves' : this.state.slaves } );
	},

	'_disconnect' : function ( data ) {
		console.log( data );
	},

	'_updateSlaveList' : function ( slaves ) {
		slaves.map( function ( slave, key ) {
			slave.activeTab = key === 0;
			slave.stdout    = [ ];

			if ( key === 0 ) {
				this.setState( { 'activeSlave' : slave } );
			}
		}.bind( this ) );

		this.setState( { 'slaves' : slaves } );
	},

	'_setActiveTab' : function ( index, activeSlave ) {
		this.state.slaves.map( function ( slave, key ) {
			slave.activeTab = key === parseInt( index, 10 );
		} );

		this.setState( { 'slaves' : this.state.slaves } );
		this.setState( { 'activeSlave' : activeSlave } );
	},

	'render' : function () {
		return (
			<div>
				<SlaveTabs slaves={ this.state.slaves } onSwitchTab={ this._setActiveTab } />
				<SlaveContainer slave={ this.state.activeSlave } />
				<StdoutContainer slave={ this.state.activeSlave } />
			</div>
		);
	}

} );

ReactDOM.render(
	<MasterSlaveApp />,
	document.getElementById( 'app' )
);
