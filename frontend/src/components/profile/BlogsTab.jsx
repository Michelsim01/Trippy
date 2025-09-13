import React from 'react';
import { Calendar, Users } from 'lucide-react';

const BlogsTab = ({ blogs }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold text-neutrals-1 mb-6">Blogs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogs.map((blog) => (
                    <div key={blog.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <img 
                            src={blog.image} 
                            alt={blog.title}
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                            <h4 className="font-semibold text-neutrals-1 mb-2 line-clamp-2">{blog.title}</h4>
                            <div className="flex items-center justify-between text-sm text-neutrals-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{blog.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>{blog.views}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BlogsTab;
