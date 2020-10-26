/**
 * @fileoverview A utility for rewriting CSS URLs.
 * @author nzakas
 */
/*eslint no-underscore-dangle:0*/

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var Transform = require("stream").Transform,
    URLRewriter = require("./url-rewriter");

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

/**
 * Creates a new instance of a URL rewriter stream.
 * @param {Function} replacer A function that receives each URL it comes across
 *      as a parameter and returns the URL to replace it with.
 * @constructor
 */
function URLRewriteStream(replacer) {

    if (typeof replacer !== "function") {
        throw new TypeError("Constructor expects a function as an argument.");
    }

    Transform.call(this, { objectMode: true });

    /**
     * The replacer function to use.
     * @type Function
     */
    this.replacer = replacer;

    /**
     * Any partial data that isn't ready to be returned yet.
     * @type *
     */
    this._buffer = "";
}

URLRewriteStream.prototype = Object.create(Transform.prototype);

/**
 * Transforms the incoming data by replacing any URLs contained in it.
 * @param {Buffer} data The incoming data to transform.
 * @param {string} encoding The encoding of the data.
 * @param {Function} done The callback to call when processing is complete.
 * @returns {void}
 * @private
 */
URLRewriteStream.prototype._transform = function(data, encoding, done) {
    // append the new data for processing
    this._buffer += data.toString();

    // see if there's a complete line to process yet
    var lastNewlineIndex = this._buffer.lastIndexOf("\n");

    if (lastNewlineIndex > -1) {
        const leftover = this._buffer.substring(lastNewlineIndex + 1, this._buffer.length);
        const ready = this._buffer.substring(0, lastNewlineIndex + 1);

        this._buffer = leftover;

        // rewrite the lines
        this._rewrite(ready);
    }

    done();
};

/**
 * Transforms the last batch of information.
 * @param {Function} done The callback to call when processing is complete.
 * @returns {void}
 * @private
 */
URLRewriteStream.prototype._flush = function(done) {

    // if there was anything left from the last chunk, add it now
    if (this._buffer) {

        // rewrite the lines
        this._rewrite(this._buffer);

    }

    done();
};

/**
 * Do the actual url rewriting of a chunk, handle errors.
 * @param  {string} text string to rewrite
 * @returns {void}
 * @private
 */
URLRewriteStream.prototype._rewrite = function(text) {

    var rewriter = new URLRewriter(this.replacer);
    try {
        this.push(rewriter.rewrite(text));
    } catch (e) {
        this.emit("error", e);
    }
};

/**
 * @module url-rewrite-stream
 */
module.exports = URLRewriteStream;
