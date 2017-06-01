'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

// JS代码校验。只校验用户自定义的js文件，不校验第三方js文件，如jQuery
gulp.task('jslint', function() {
	return gulp.src('src/js/user/**/*.js')
		.pipe(plugins.jshint())
		.pipe(plugins.jshint.reporter());
});

// 监听所有文件改动：自动刷新
gulp.task('reload', function() {
	return gulp.src('src/**/*')
		.pipe(plugins.connect.reload());
});

// 编译less文件，并监听less文件改动：重新编译+自动刷新
gulp.task('less', function() {
	return gulp.src('src/less/**/*.less')
		.pipe(plugins.plumber({errorHandler: plugins.notify.onError('Error: <%= error.message %>')})) // 防止less出错，自动退出watch
		.pipe(plugins.less())
		.pipe(gulp.dest('src/css/compile'))
		.pipe(plugins.connect.reload());
});

// 编译sass文件，并监听sass文件改动：重新编译+自动刷新
gulp.task('sass', function() {
	return gulp.src('src/sass/**/*.{sass,scss}')
		.pipe(plugins.plumber({errorHandler: plugins.notify.onError('Error: <%= error.message %>')})) // 防止sass出错，自动退出watch
		// (1) 如果只使用 sass, 请使用sass插件:
		// .pipe(plugins.sass({
		// 	outputStyle: 'expanded'  // 可选：nested  (默认)  |  expanded  |  compact  |  compressed
		// }))
		// (2) 如果使用 compass, 请使用compass插件:
		.pipe(plugins.compass({
			css: 'src/css/compile',
			sass: 'src/sass',
			image: 'src/img',
			style: 'expanded' // 可选：nested  (默认)  |  expanded  |  compact  |  compressed
		}))
		.pipe(gulp.dest('src/css/compile'))
		.pipe(plugins.connect.reload());
});

// 监听文件改动
gulp.task('watch', function() {
	gulp.watch('src/**/*', ['reload']);
	gulp.watch('src/less/**/*.less', ['less']);
	gulp.watch('src/sass/**/*.{sass,scss}', ['sass']);
});

// 运行一个服务器
gulp.task('server', function() {
	plugins.connect.server({
		root: 'src',
	    port: 8080,  // Can not be 80
	    livereload: true
	});
});

// 默认任务
gulp.task('default', function() {
	gulp.run('jslint', 'reload', 'less', 'sass', 'watch', 'server');
});

// build

gulp.task('clean', function() {
	return gulp.src('dist')
		.pipe(plugins.clean());
});

gulp.task('build-js', function() {
	return gulp.src('src/**/*.js')
		.pipe(plugins.uglify())					// JS压缩
		.pipe(plugins.rev())					// 添加MD5
		.pipe(gulp.dest('dist'))				// 保存JS文件
		.pipe(plugins.rev.manifest())			// 生成MD5映射
        .pipe(gulp.dest('dist/rev/js'));		// 保存映射
});

gulp.task('build-css', ['less', 'sass'], function() {	// 编译less/sass
	return gulp.src('src/**/*.css')
		.pipe(plugins.cleanCss())				// CSS压缩 
		.pipe(plugins.rev())					// 添加MD5
		.pipe(gulp.dest('dist'))				// 保存CSS文件
		.pipe(plugins.rev.manifest())			// 生成MD5映射
        .pipe(gulp.dest('dist/rev/css'));		// 保存映射
});

gulp.task('build-html', ['build-js', 'build-css'], function() {		// 依赖：需先生成映射
	return gulp.src(['dist/rev/**/*.json', 'src/**/*.html'])
		.pipe(plugins.revCollector())						// 根据映射，替换文件名
		.pipe(plugins.htmlmin({collapseWhitespace: true}))	// HTML压缩
		.pipe(gulp.dest('dist'));							// 保存HTML文件
});

gulp.task('build-fonts', function() {
	return gulp.src('src/**/*.{eot,ttf,woff,woff2,otf}')
		.pipe(gulp.dest('dist'));
});

gulp.task('build-img', function() {
	return gulp.src('src/**/*.{png,jpg,gif,jpeg,svg}')
		.pipe(plugins.cache(plugins.imagemin({	// 图片压缩
			interlaced: true
		})))
		.pipe(gulp.dest('dist'));
});

gulp.task('build', ['clean'], function() {
	return gulp.run('build-html', 'build-fonts', 'build-img', function() {
		gulp.src('dist/rev').pipe(plugins.clean());
	});
});