import { task, parallel, src, dest, series, watch } from 'gulp';
import rename from 'gulp-rename';
import autoprefixer from 'gulp-autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';

import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import uglify from 'gulp-uglify';
import browserSync from 'browser-sync';



const sass = gulpSass(dartSass);


var styleSrc="src/scss/style.scss";
var distStyleSrc='./dist/css/';
var watchStyle="src/scss/**/*.scss";

var jsSrc="script.js";
var jsFolder="src/js/";
var distJsSrc='./dist/js/';
var watchJs="src/js/**/*.js";

var watchPhp="**/*.php";
var watchHtml="**/*.html";

var syncVar=browserSync.create();
var reload=syncVar.reload;

const jsFile=[jsSrc];

task('browser-sync',function(){
    syncVar.init({
        open: false,
        injectChanges: true,
        proxy: "https://gulp.dev",
        https: {
            key: "D:/Softwares/laragon/etc/ssl/laragon.key",
            cert: "D:/Softwares/laragon/etc/ssl/laragon.crt"
        }
    });
});

task('style',function(done){
    src(styleSrc)
        .pipe(sourcemaps.init())
        .pipe(sass({errorLogtoConsole: true,
            outputStyle: 'compressed'
        }))
        .on('error', console.error.bind(console))
        .pipe(autoprefixer({overrideBrowserslist: ['last 2 versions'],cascade: false}))
        .pipe(rename({suffix: ".min"}))
        .pipe(sourcemaps.write('./'))
        .pipe( dest(distStyleSrc) )
        .pipe(syncVar.stream());
    done()
});

task('js',function(done){
    // src(jsSrc)
    // .pipe( dest(distJsSrc) );

    jsFile.map(function(entry){
        return browserify(jsFolder + entry)
            .transform(babelify, { presets: ['@babel/preset-env'] })
            .bundle()
            .pipe(source(entry))
            .pipe(rename({'extname': ".min.js"}))
            .pipe(buffer())
            .pipe(sourcemaps.init())
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(dest(distJsSrc))
            .pipe(syncVar.stream());
    });
    
    // browsify (add all the dependencies)
    // transform babelify (convert latest es6 javascript into vanilla or regular javascript)
    // bundle (into single file)
    // source (find source)
    // rename (.min)
    // buffer (protect it by barriers)
    // init sourcemap()
    // uglify (minify file)
    // write sourcemap
    // dist (save it)
    done();
});

task('default',series('style','js'));

task('watch', function() {
    series('default');

    //.on("change",reload) does the refrest without refresh the changes will be synced in the browser but inspector will not be reset
    watch(watchStyle, series('style')).on("change",reload);
    watch(watchJs, series('js')).on("change",reload);

    watch(watchPhp,syncVar.stream()).on("change",reload);
    watch(watchHtml,syncVar.stream()).on("change",reload);
});

task('serve', parallel('browser-sync','default','watch'));
