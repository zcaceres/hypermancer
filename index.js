

/**
 * TODO:
 * 5. bell sound
*/

const onoSendai = require('./ono-sendai.js')
const HUE_SHIFT_INTENSITY = 8;
const YELLOW = '#FFFA3B'
const GREEN = '#21FF58'
const PURPLE = 'rgb(218, 91, 205)'
const BLUE = 'rgb(44, 255, 254)'
const FONT_SIZE = 16

const HOSAKA_RED = '234, 32, 45'
const WHITE = '#FFF'

exports.decorateConfig = (config) => {
  return Object.assign({}, config, {
    foregroundColor: BLUE,
    backgroundColor: 'black',
    fontSize: FONT_SIZE,
    fontFamily: '"Share Tech Mono"',
    borderColor: `rgb(${HOSAKA_RED})`,
    selectionColor: `rgba(${HOSAKA_RED}, 0.3)`,
    cursorColor: `rgb(${HOSAKA_RED})`,
    colors: [
      YELLOW,
      `rgb(${HOSAKA_RED})`,
      PURPLE,
      GREEN,
      BLUE,
      WHITE
    ]
  });
}

exports.decorateTerm = (Terms, { React }) => {
    return class extends React.Component {
        constructor(props, context) {
            super(props, context);
            this.term = null;
            this.onDecorated = this.onDecorated.bind(this);
            this.onCursorMove = this.onCursorMove.bind(this);
            this.glitchingTimeout = null;
            this._div = null;
            this._terminal = null;
            this._isGlitching = false
            this._canvas = null;
            this._textCanvas = null;
            this._glitchText = this._glitchText.bind(this);
            this._resizeCanvas = this._resizeCanvas.bind(this);
        }

        componentWillUnmount() {
            this._terminal.removeChild(this._canvas);
        }

        _initCanvas() {
            this._canvas = document.createElement('canvas');
            this._canvas.style.position = 'absolute';
            /**
             * Hyper's canvases are much larger than the actual viewable area.
             * The `canvas` width & height are large, while the style elements should
             * be the same as the textCanvas we are overlaying.
             */
            this._canvas.style.width = this._textCanvas.style.width
            this._canvas.style.height = this._textCanvas.style.height
            this._canvas.width = this._textCanvas.width
            this._canvas.height = this._textCanvas.height

            this._canvas.style.backgroundImage = onoSendai
            this._canvas.style.backgroundPosition = 'center center'
            this._canvas.style.backgroundSize = 'contain'
            this._canvas.style.backgroundRepeat = 'no-repeat'
            this._canvas.style.top = '0';
            this._canvas.style.pointerEvents = 'none';
            this._canvasContext = this._canvas.getContext('2d');
            this._terminal.appendChild(this._canvas);

            window.requestAnimationFrame(this._glitchText);
            /**
             * Listens for changes to the canvas so that the injected canvas can be the same height.
             */
            window.addEventListener('resize', this._resizeCanvas);
        }

        _resizeCanvas() {
            this._canvas.style.width = this._textCanvas.style.width
            this._canvas.style.height = this._textCanvas.style.height
            this._canvas.width = this._textCanvas.width
            this._canvas.height = this._textCanvas.height
        }

        _glitchText() {
            var randInt = function(a, b) {
				      return ~~(Math.random() * (b - a) + a);
            };
            const destCtx = this._canvas.getContext('2d');
            /**
             * Draws the existing text in an offset way with messed up colors
             */
            destCtx.drawImage(this._textCanvas, this._div.offsetLeft, this._div.offsetTop + 34);
            destCtx.filter = `hue-rotate(${Math.random() * 360}deg)`;
            var x = Math.random() * this._canvas.width;
            var y = Math.random() * this._canvas.height;
            var spliceWidth = this._canvas.width - x;
            var spliceHeight = randInt(5, this._canvas.height / 3);

            // These are the rectangles injected onto the canvas
            destCtx.drawImage(this._canvas, 0, y, spliceWidth, spliceHeight, x, y, spliceWidth, spliceHeight);
            destCtx.drawImage(this._canvas, spliceWidth, y, x, spliceHeight, 0, y, x, spliceHeight);
        }

        onCursorMove(cursorFrame) {
            if (this.props.onCursorMove) this.props.onCursorMove(cursorFrame);
            window.requestAnimationFrame(this._glitchText);

            if (this.glitchingTimeout !== null) {
                clearTimeout(this.glitchingTimeout);
            }

            const randomDelay = getRandomInt(200, 400)

            this.glitchingTimeout = setTimeout(() => {
                const destCtx = this._canvas.getContext('2d');
                destCtx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            }, randomDelay);
        }

        onDecorated(term) {
          try {
            this.term = term;
            this._div = term.termRef;
            this._terminal = this._div.querySelector('.terminal')
            this._textCanvas = this._div.querySelector('.xterm-screen').children[3];
            // Don't forget to propagate it to HOC chain
            if (this.props.onDecorated) this.props.onDecorated(term);

          /**
           * Hyper seems to style the _textCanvas component at some future point.
           * So we delay or else we'll get incorrect initial styles.
           */
            setTimeout(() => this._initCanvas(), 500)
          } catch (e) {
            console.error(e)
          }
        }

        render() {
            return React.createElement(
                Terms,
                Object.assign({}, this.props, {
                    onDecorated: this.onDecorated,
                    onCursorMove: this.onCursorMove
                })
            );
        }
    };
};


function generateTextShadow() {
  let x = -1 + 2 * Math.random();
  x = x * x;
  const intensity = HUE_SHIFT_INTENSITY * x;
  return `text-shadow: ${intensity}px 0 1px rgba(0,30,255,0.5), ${-intensity}px 0 1px rgba(255,0,80,0.3), 0 0 3px !important;`
}

exports.decorateHyper = (HyperTerm, {
  React,
  notify
}) => {
  return class extends React.Component {
    constructor(props, context) {
      super(props, context);
      this._intervalID = null
      this.state = {
        shadow: true
      }
      this._renderShadow = this._renderShadow.bind(this);
    }

    componentWillMount() {
      this._intervalID = setInterval(this._renderShadow, 120)
    }

    componentWillUnmount() {
      clearInterval(this._intervalID);
    }

    /**
     * this is a nonsense state trigger to make sure the component re-renders
     * each time the interval for _renderShadow fires
     */
    _renderShadow () {
      this.setState({
        shadow: !this.state.shadow
      })
    }

    render() {
      const textShadow = generateTextShadow();

      const overridenProps = {
        backgroundColor: 'black',
        customCSS: `
          ${this.props.customCSS || ''}
          .tabs_nav {
            font-size: ${FONT_SIZE}px;
          }
          .tabs_nav .tabs_title {
            color: rgb(${HOSAKA_RED}) !important;
            font-weight: bold !important;
            ${textShadow}
          }

          .tabs_list {
            background-color: rgb(${HOSAKA_RED}) !important;
            background-image: none !important;
          }
          .tab_tab {
            border-width: 0px !important;
            border-right: 0px solid transparent !important;
            border-left: 1px solid rgb(${HOSAKA_RED}) !important;
          }
          .tab_tab:not(.tab_active) {
            color: rgba(${HOSAKA_RED}, 0.7);
          }
          .tab_tab.tab_active {
            height: calc(100% + 1px);
            border-left: 0px solid rgb(${HOSAKA_RED}) !important;
            ${textShadow}
            font-weight: bold;
            color: rgb(${HOSAKA_RED});
          }
          /* Hide hardcoded black bottom border */
          .tab_active:before {
            border-bottom: none !important;
            border-left: 1px solid transparent !important;
          }
        `,
      };
      return React.createElement(HyperTerm, Object.assign({}, this.props, overridenProps));
    }
  }
}

function getRandomInt(min, max) {
  return Math.max(min, Math.floor(min, Math.random() * Math.floor(max)))
}
