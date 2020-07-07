const Post = require('../models/Post')

exports.viewCreateScreen = function (req, res) {
    res.render('create-post')
}

exports.create = function (req, res) {
    let post = new Post(req.body, req.session.user._id)
    post.create().then(function (newId) {
        req.flash('success', "New post successfully created")
        req.session.save(() => {
            res.redirect(`/post/${newId}`)
        })
    }).catch(function (errors) {
        errors.forEach(error => req.flash('errors', error))
        req.session.save(() => res.redirect('/create-post'))
    })

}



exports.viewSingle = async function (req, res) {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('single-post-screen', {
            post: post,
            title: post.title
        })
    } catch {
        res.render('404')
    }
}

exports.viewEditScreen = async function (req, res) {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        if (post.isVisitorOwner) {
            res.render("edit-post", {
                post: post
            })
        } else {
            req.flash("errors", "You do not have permission to perform that action.")
            req.session.save(() => res.redirect("/"))
        }
    } catch {
        res.render("404")
    }
}

exports.edit = function (req, res) {
    let post = new Post(req.body, req.visitorId, req.params.id)
    post.update().then((status) => {
        //the post was successfully updated in the db
        // or user did have permission but there were validation errors
        if (status = "success") {
            //post was successfully updated in the db
            req.flash("success", "Post successfully updated")
            req.session.save(() => {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        } else {
            post.errors.forEach((error) => {
                req.flash('errors', error)
            })

            req.session.save(() => {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(() => {
        // a post with the requested id doesn't exist
        // or the current visitor isn't the owner of the requested post
        req.flash('errors', "You do not have permission to perform this action")
        req.session.save(function () {
            res.redirect('/')
        })
    })
}

exports.delete = function (req, res) {

    Post.delete(req.params.id, req.visitorId).then(function () {
            req.flash("success", "Post successfully deleted")
            req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
        })
        .catch(function () {
            req.flash('errors', "You do not have permision to perform that action")
            req.session.save(() => res.redirect('/'))
        })
}


exports.search = function (req, res) {
    Post.search(req.body.searchTerm).then(posts => {
        res.json(posts)
    }).catch(() => {
        res.json([])
    })
}

// API
exports.apiCreate = function (req, res) {
    let post = new Post(req.body, req.apiUser._id)
    post.create().then(function (newId) {
        res.json("congrats")
    }).catch(function (errors) {
        res.json(errors)
    })

}

exports.apiDelete = function (req, res) {

    Post.delete(req.params.id, req.apiUser._id).then(function () {
            res.json("Success")
        })
        .catch(function () {
            res.json("You do not have permission to perform this action")
        })
}