import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';

const SideBar = () => {

  const { isEducator, isAdmin } = useContext(AppContext) // Get isAdmin state

  const menuItems = [
    { name: 'Dashboard', path: '/educator', icon: assets.home_icon },
    { name: 'Add Course', path: '/educator/add-course', icon: assets.add_icon },
    { name: 'Add Quiz', path: '/educator/add-quiz', icon: assets.my_course_icon }, // New Link
    { name: 'My Courses', path: '/educator/my-courses', icon: assets.my_course_icon },
    { name: 'Student Enrolled', path: '/educator/student-enrolled', icon: assets.person_tick_icon },
  ];

  return isEducator && (
    <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-500 py-2 flex flex-col'>
      {menuItems.map((item) => (
        <NavLink
          to={item.path}
          key={item.name}
          end={item.path === '/educator'} // Add end prop for the Dashboard link
          className={({ isActive }) =>
            `flex items-center md:flex-row flex-col md:justify-start justify-center py-3.5 md:px-10 gap-3 ${isActive
              ? 'bg-indigo-50 border-r-[6px] border-indigo-500/90'
              : 'hover:bg-gray-100/90 border-r-[6px] border-white hover:border-gray-100/90'
            }`
          }
        >
          {/* I'm using my_course_icon for Add Quiz, you can change it */}
          <img src={item.icon} alt="" className="w-6 h-6" />
          <p className='md:block hidden text-center'>{item.name}</p>
        </NavLink>
      ))}

      {/* Conditionally render the Admin Panel link */}
      {isAdmin && (
        <NavLink
          to="/educator/admin-panel"
          key="admin-panel"
          className={({ isActive }) =>
            `flex items-center md:flex-row flex-col md:justify-start justify-center py-3.5 md:px-10 gap-3 ${isActive
              ? 'bg-indigo-50 border-r-[6px] border-indigo-500/90'
              : 'hover:bg-gray-100/90 border-r-[6px] border-white hover:border-gray-100/90'
            }`
          }
        >
          {/* You can use any icon, here I'm re-using 'person_tick_icon' */}
          <img src={assets.person_tick_icon} alt="" className="w-6 h-6" /> 
          <p className='md:block hidden text-center'>Admin Panel</p>
        </NavLink>
      )}
    </div>
  );
};

export default SideBar;